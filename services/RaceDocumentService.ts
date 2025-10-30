/**
 * Race Document Service
 * Manages race-specific documents (sailing instructions, NOTAMs, amendments, etc.)
 */

import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';
import { documentStorageService, StoredDocument } from './storage/DocumentStorageService';

const logger = createLogger('RaceDocumentService');

export type RaceDocumentType =
  | 'sailing_instructions'
  | 'nor'
  | 'course_diagram'
  | 'amendment'
  | 'notam'
  | 'other';

export interface RaceDocument {
  id: string;
  regattaId: string;
  documentId: string;
  userId: string;
  documentType: RaceDocumentType;
  sharedWithFleet: boolean;
  fleetId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface RaceDocumentWithDetails extends RaceDocument {
  document?: StoredDocument;
}

class RaceDocumentService {
  /**
   * Upload document for a race
   */
  async uploadRaceDocument(params: {
    regattaId: string;
    userId: string;
    file: File | Blob;
    documentType: RaceDocumentType;
    filename?: string;
    shareWithFleet?: boolean;
    fleetId?: string;
  }): Promise<RaceDocument | null> {
    try {
      // First, upload the document using DocumentStorageService
      const uploadResult = await documentStorageService.uploadDocument(
        params.file,
        params.userId,
        params.filename
      );

      if (!uploadResult.success || !uploadResult.document) {
        logger.error('Failed to upload document');
        return null;
      }

      // Then, link it to the race
      const { data, error } = await supabase
        .from('race_documents')
        .insert({
          regatta_id: params.regattaId,
          document_id: uploadResult.document.id,
          user_id: params.userId,
          document_type: params.documentType,
          shared_with_fleet: params.shareWithFleet || false,
          fleet_id: params.fleetId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error linking document to race:', error);
        throw error;
      }

      return this.mapRaceDocument(data);
    } catch (error) {
      logger.error('Exception in uploadRaceDocument:', error);
      return null;
    }
  }

  /**
   * Link existing document to a race
   */
  async linkDocumentToRace(params: {
    regattaId: string;
    documentId: string;
    userId: string;
    documentType: RaceDocumentType;
    shareWithFleet?: boolean;
    fleetId?: string;
  }): Promise<RaceDocument | null> {
    try {
      const { data, error } = await supabase
        .from('race_documents')
        .insert({
          regatta_id: params.regattaId,
          document_id: params.documentId,
          user_id: params.userId,
          document_type: params.documentType,
          shared_with_fleet: params.shareWithFleet || false,
          fleet_id: params.fleetId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error linking document to race:', error);
        throw error;
      }

      return this.mapRaceDocument(data);
    } catch (error) {
      logger.error('Exception in linkDocumentToRace:', error);
      return null;
    }
  }

  /**
   * Get all documents for a race
   */
  async getRaceDocuments(regattaId: string): Promise<RaceDocumentWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('race_documents')
        .select('*')
        .eq('regatta_id', regattaId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching race documents:', error);
        throw error;
      }

      // Fetch document details for each race document
      const documentsWithDetails = await Promise.all(
        (data || []).map(async (raceDoc) => {
          try {
            const { data: docData, error: docError } = await supabase
              .from('documents')
              .select('*')
              .eq('id', raceDoc.document_id)
              .single();

            if (docError) {
              logger.warn('Could not fetch document details:', docError);
              return this.mapRaceDocument(raceDoc);
            }

            return {
              ...this.mapRaceDocument(raceDoc),
              document: {
                id: docData.id,
                user_id: docData.user_id,
                filename: docData.filename,
                file_type: docData.file_type,
                file_size: docData.file_size,
                storage_path: docData.storage_path,
                created_at: docData.created_at,
                updated_at: docData.updated_at,
                metadata: docData.metadata,
              } as StoredDocument,
            };
          } catch (err) {
            logger.warn('Exception fetching document details:', err);
            return this.mapRaceDocument(raceDoc);
          }
        })
      );

      return documentsWithDetails;
    } catch (error) {
      logger.error('Exception in getRaceDocuments:', error);
      return [];
    }
  }

  /**
   * Get documents by type
   */
  async getRaceDocumentsByType(
    regattaId: string,
    documentType: RaceDocumentType
  ): Promise<RaceDocumentWithDetails[]> {
    try {
      const allDocuments = await this.getRaceDocuments(regattaId);
      return allDocuments.filter((doc) => doc.documentType === documentType);
    } catch (error) {
      logger.error('Exception in getRaceDocumentsByType:', error);
      return [];
    }
  }

  /**
   * Share document with fleet
   */
  async shareDocumentWithFleet(raceDocumentId: string, fleetId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('race_documents')
        .update({
          shared_with_fleet: true,
          fleet_id: fleetId,
        })
        .eq('id', raceDocumentId);

      if (error) {
        logger.error('Error sharing document with fleet:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Exception in shareDocumentWithFleet:', error);
      return false;
    }
  }

  /**
   * Unshare document from fleet
   */
  async unshareDocumentFromFleet(raceDocumentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('race_documents')
        .update({
          shared_with_fleet: false,
          fleet_id: null,
        })
        .eq('id', raceDocumentId);

      if (error) {
        logger.error('Error unsharing document from fleet:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Exception in unshareDocumentFromFleet:', error);
      return false;
    }
  }

  /**
   * Get fleet shared documents for a race
   */
  async getFleetSharedDocuments(regattaId: string, fleetId: string): Promise<RaceDocumentWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('race_documents')
        .select('*')
        .eq('regatta_id', regattaId)
        .eq('fleet_id', fleetId)
        .eq('shared_with_fleet', true)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching fleet shared documents:', error);
        throw error;
      }

      // Map to full details
      return Promise.all(
        (data || []).map(async (raceDoc) => {
          const doc = await this.getRaceDocumentDetails(raceDoc.document_id);
          return {
            ...this.mapRaceDocument(raceDoc),
            document: doc || undefined,
          };
        })
      );
    } catch (error) {
      logger.error('Exception in getFleetSharedDocuments:', error);
      return [];
    }
  }

  /**
   * Delete race document link (does not delete the actual document)
   */
  async unlinkDocumentFromRace(raceDocumentId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('race_documents').delete().eq('id', raceDocumentId);

      if (error) {
        logger.error('Error unlinking document from race:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Exception in unlinkDocumentFromRace:', error);
      return false;
    }
  }

  /**
   * Get race document statistics
   */
  async getRaceDocumentStats(regattaId: string): Promise<{
    total: number;
    byType: Record<RaceDocumentType, number>;
    sharedWithFleet: number;
  }> {
    try {
      const documents = await this.getRaceDocuments(regattaId);

      const stats = {
        total: documents.length,
        byType: {} as Record<RaceDocumentType, number>,
        sharedWithFleet: documents.filter((d) => d.sharedWithFleet).length,
      };

      // Count by type
      documents.forEach((doc) => {
        stats.byType[doc.documentType] = (stats.byType[doc.documentType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Exception in getRaceDocumentStats:', error);
      return {
        total: 0,
        byType: {} as Record<RaceDocumentType, number>,
        sharedWithFleet: 0,
      };
    }
  }

  /**
   * Helper: Get document details from documents table
   */
  private async getRaceDocumentDetails(documentId: string): Promise<StoredDocument | null> {
    try {
      const { data, error } = await supabase.from('documents').select('*').eq('id', documentId).single();

      if (error) {
        logger.error('Error fetching document details:', error);
        return null;
      }

      return {
        id: data.id,
        user_id: data.user_id,
        filename: data.filename,
        file_type: data.file_type,
        file_size: data.file_size,
        storage_path: data.storage_path,
        created_at: data.created_at,
        updated_at: data.updated_at,
        metadata: data.metadata,
      } as StoredDocument;
    } catch (error) {
      logger.error('Exception in getRaceDocumentDetails:', error);
      return null;
    }
  }

  /**
   * Helper method to map database row to RaceDocument
   */
  private mapRaceDocument(data: any): RaceDocument {
    return {
      id: data.id,
      regattaId: data.regatta_id,
      documentId: data.document_id,
      userId: data.user_id,
      documentType: data.document_type as RaceDocumentType,
      sharedWithFleet: data.shared_with_fleet || false,
      fleetId: data.fleet_id,
      createdAt: data.created_at,
      metadata: data.metadata,
    };
  }
}

export const raceDocumentService = new RaceDocumentService();
