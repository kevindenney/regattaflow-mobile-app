/**
 * Document Storage Service for RegattaFlow
 * Handles document upload, storage, and retrieval with Supabase
 */

import { supabase } from '@/src/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

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

export class DocumentStorageService {
  private readonly bucketName = 'documents';
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  /**
   * Pick and upload a document
   */
  async pickAndUploadDocument(userId: string): Promise<UploadResult> {
    try {
      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: false,
      });

      if (result.canceled) {
        return { success: false, error: 'Document selection cancelled' };
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
      console.error('Document picker error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload document to Supabase storage
   */
  async uploadDocument(userId: string, file: DocumentPicker.DocumentPickerAsset): Promise<UploadResult> {
    try {
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      let fileData: any;

      if (Platform.OS === 'web') {
        // For web, fetch the file as blob
        const response = await fetch(file.uri);
        fileData = await response.blob();
      } else {
        // For mobile, read file as base64
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileData = base64;
      }

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, fileData, {
          contentType: file.mimeType || 'application/octet-stream',
          upsert: false,
        });

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

    } catch (error: any) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(userId: string): Promise<StoredDocument[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      return [];
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string): Promise<boolean> {
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