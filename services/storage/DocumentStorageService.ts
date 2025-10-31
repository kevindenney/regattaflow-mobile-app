// @ts-nocheck

/**
 * Document Storage Service for RegattaFlow
 * Handles document upload, storage, and retrieval with Supabase
 */

import { supabase } from '@/services/supabase';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { createLogger } from '@/lib/utils/logger';

export interface StoredDocument {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UploadResult {
  success: boolean;
  document?: StoredDocument;
  error?: string;
}

const logger = createLogger('DocumentStorageService');
export class DocumentStorageService {
  private readonly bucketName = 'documents';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  /**
   * Pick and upload a document
   */
  async pickAndUploadDocument(userId: string): Promise<UploadResult> {

    try {

      // Check if we're on web and DocumentPicker might not work
      if (Platform.OS === 'web') {

        // Test if DocumentPicker is available on web
        if (!DocumentPicker.getDocumentAsync) {

          return {
            success: false,
            error: 'Document picker not supported on web platform. Please use the mobile app for file uploads.'
          };
        }
      }

      // Add timeout for document picker
      const pickerPromise = DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: false,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error('⏰ DocumentStorageService: Document picker timeout after 30 seconds');
          reject(new Error('Document picker timeout - please try again'));
        }, 30000);
      });

      const result = await Promise.race([pickerPromise, timeoutPromise]) as any;

      if (result.canceled) {
        return { success: false, error: 'Document selection cancelled' };
      }

      if (!result.assets || result.assets.length === 0) {
        return { success: false, error: 'No document selected' };
      }

      const file = result.assets[0];

      // Validate file size
      if (file.size && file.size > this.maxFileSize) {
        return {
          success: false,
          error: `File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`
        };
      }

      // Upload to Supabase
      return await this.uploadDocument(userId, file);

    } catch (error: any) {

      // Check for specific web-related errors
      if (error.message?.includes('user activation') || error.message?.includes('gesture')) {
        return {
          success: false,
          error: 'File picker requires user interaction. Please try clicking the upload button again.'
        };
      }

      return { success: false, error: error.message || 'Failed to open file picker' };
    }
  }

  /**
   * Upload document to Supabase storage
   */
  async uploadDocument(userId: string, file: DocumentPicker.DocumentPickerAsset): Promise<UploadResult> {
    try {
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      let fileData: any;

      // Read file data based on platform
      if (Platform.OS === 'web') {

        const response = await fetch(file.uri);

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        fileData = await response.blob();
      } else {
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileData = base64;
      }

      // Check if we should use local storage fallback
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
      const useLocalFallback = supabaseUrl === 'https://placeholder.supabase.co' || Platform.OS === 'web';

      if (useLocalFallback) {

        // Create a mock document object
        const mockDocument: StoredDocument = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          filename: file.name,
          file_type: file.mimeType || 'unknown',
          file_size: file.size || 0,
          storage_path: fileName,
          public_url: file.uri, // Use the blob URL as the public URL
          metadata: {
            original_uri: file.uri,
            locallyStored: true,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Store in localStorage for persistence
        try {
          const existingDocs = localStorage.getItem('regattaflow_documents');
          const documents = existingDocs ? JSON.parse(existingDocs) : [];
          documents.push(mockDocument);
          localStorage.setItem('regattaflow_documents', JSON.stringify(documents));

          return {
            success: true,
            document: mockDocument,
          };
        } catch (localError) {

          throw new Error('Failed to store document locally');
        }
      } else {
        // Original Supabase upload flow

        // Test bucket access first
        logger.debug('🪣 DocumentStorageService: Testing bucket access...');
        const { data: bucketTest, error: bucketError } = await Promise.race([
          supabase.storage.from(this.bucketName).list('', { limit: 1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Bucket test timeout')), 10000))
        ]) as any;

        if (bucketError) {

          throw new Error(`Storage bucket '${this.bucketName}' access failed: ${bucketError.message}`);
        }

        // Upload file to Supabase
        const uploadPromise = supabase.storage
          .from(this.bucketName)
          .upload(fileName, fileData, {
            contentType: file.mimeType || 'application/octet-stream',
            upsert: false,
          });

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Upload timeout after 60 seconds'));
          }, 60000);
        });

        const { data: uploadData, error: uploadError } = await Promise.race([
          uploadPromise,
          timeoutPromise
        ]) as any;

        if (uploadError) {

          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(fileName);

        // Store document metadata in database

        const { data: docData, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: userId,
            filename: file.name,
            file_type: file.mimeType || 'unknown',
            file_size: file.size || 0,
            storage_path: fileName,
            public_url: urlData.publicUrl,
            metadata: {
              original_uri: file.uri,
            },
          })
          .select()
          .single();

        if (dbError) {

          // Clean up uploaded file if database insert fails
          await supabase.storage
            .from(this.bucketName)
            .remove([fileName]);
          throw dbError;
        }

        return {
          success: true,
          document: docData,
        };
      }

    } catch (error: any) {

      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(userId: string): Promise<StoredDocument[]> {

    try {

      // Check if Supabase is properly configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

      if (supabaseUrl === 'https://placeholder.supabase.co' || Platform.OS === 'web') {
        console.warn('📄 DocumentStorageService: Using local storage fallback for documents');

        // Get documents from localStorage
        try {
          const storedDocs = localStorage.getItem('regattaflow_documents');
          if (storedDocs) {
            const documents = JSON.parse(storedDocs);
            // Filter by userId
            const userDocs = documents.filter((doc: StoredDocument) => doc.user_id === userId);
            return userDocs;
          }
        } catch (localError) {
          console.error('📄 DocumentStorageService: Error reading local storage:', localError);
        }

        return [];
      }

      // Test Supabase connection first with timeout
      try {

        const connectionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection test timeout after 5 seconds')), 5000);
        });

        const connectionResult = await Promise.race([connectionPromise, timeoutPromise]);
        const { data: connectionTest, error: connectionError } = connectionResult as any;

      } catch (connErr) {
        console.error('📄 DocumentStorageService: Connection test failed, returning empty array:', connErr);
        return [];
      }

      // Add timeout mechanism for database query
      const queryPromise = supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
      });

      // Race the query against timeout
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result as any;

      if (error) {
        console.error('📄 DocumentStorageService: Database error:', error);

        // Check if table doesn't exist
        if (error.message?.includes('relation "documents" does not exist') ||
            error.code === 'PGRST204' ||
            error.code === '42P01') {
          console.warn('📄 DocumentStorageService: documents table does not exist, returning empty array');
          return [];
        }

        throw error;
      }

      return data || [];

    } catch (error: any) {
      console.error('📄 DocumentStorageService: Failed to fetch documents:', error);
      return [];
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      // Check if we're using local storage
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
      if (supabaseUrl === 'https://placeholder.supabase.co' || Platform.OS === 'web') {

        const storedDocs = localStorage.getItem('regattaflow_documents');
        if (storedDocs) {
          const documents = JSON.parse(storedDocs);
          const filteredDocs = documents.filter((doc: StoredDocument) =>
            doc.id !== documentId || doc.user_id !== userId
          );
          localStorage.setItem('regattaflow_documents', JSON.stringify(filteredDocs));

          return true;
        }
        return false;
      }
      // Get document details
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !doc) {
        throw new Error('Document not found');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.bucketName)
        .remove([doc.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', userId);

      if (dbError) throw dbError;

      return true;

    } catch (error: any) {
      console.error('Delete document error:', error);
      return false;
    }
  }

  /**
   * Download document content
   */
  async downloadDocument(documentId: string, userId: string): Promise<Blob | null> {
    try {
      // Get document details
      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !doc) {
        throw new Error('Document not found');
      }

      // Download from storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(doc.storage_path);

      if (error) throw error;
      return data;

    } catch (error: any) {
      console.error('Download document error:', error);
      return null;
    }
  }

  /**
   * Get document analysis status
   */
  async getDocumentAnalysis(documentId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('document_analysis')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;

    } catch (error: any) {
      console.error('Failed to get document analysis:', error);
      return null;
    }
  }

  /**
   * Update document analysis
   */
  async updateDocumentAnalysis(documentId: string, analysis: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('document_analysis')
        .upsert({
          document_id: documentId,
          analysis_data: analysis,
          analyzed_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;

    } catch (error: any) {
      console.error('Failed to update document analysis:', error);
      return false;
    }
  }
}

export const documentStorageService = new DocumentStorageService();
