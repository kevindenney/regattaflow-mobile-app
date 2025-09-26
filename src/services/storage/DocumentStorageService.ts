/**
 * Document Storage Service for RegattaFlow
 * Handles document upload, storage, and retrieval with Supabase
 */

import { supabase } from '@/src/services/supabase';
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
    console.log('📁 DocumentStorageService: pickAndUploadDocument called with userId:', userId);
    console.log('📁 DocumentStorageService: Platform check:', Platform.OS);
    console.log('📁 DocumentStorageService: Window check:', typeof window !== 'undefined');

    try {
      console.log('📁 DocumentStorageService: About to call DocumentPicker.getDocumentAsync');
      console.log('📁 DocumentStorageService: DocumentPicker available:', !!DocumentPicker);
      console.log('📁 DocumentStorageService: getDocumentAsync available:', !!DocumentPicker.getDocumentAsync);

      // Check if we're on web and DocumentPicker might not work
      if (Platform.OS === 'web') {
        console.log('🌐 DocumentStorageService: Running on web platform - checking DocumentPicker compatibility');

        // Test if DocumentPicker is available on web
        if (!DocumentPicker.getDocumentAsync) {
          console.error('❌ DocumentStorageService: DocumentPicker.getDocumentAsync not available on web');
          return {
            success: false,
            error: 'Document picker not supported on web platform. Please use the mobile app for file uploads.'
          };
        }
      }

      console.log('📁 DocumentStorageService: Calling DocumentPicker.getDocumentAsync with options:', {
        type: ['application/pdf', 'image/*'],
        multiple: false,
      });

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

      console.log('📁 DocumentStorageService: Racing picker promise against timeout...');
      const result = await Promise.race([pickerPromise, timeoutPromise]) as any;

      console.log('📁 DocumentStorageService: Document picker result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetsLength: result.assets?.length,
        resultType: result.type || 'unknown'
      });

      if (result.canceled) {
        console.log('📁 DocumentStorageService: Document selection was cancelled by user');
        return { success: false, error: 'Document selection cancelled' };
      }

      if (!result.assets || result.assets.length === 0) {
        console.error('❌ DocumentStorageService: No assets in document picker result');
        return { success: false, error: 'No document selected' };
      }

      const file = result.assets[0];
      console.log('📁 DocumentStorageService: Selected file details:', {
        name: file.name,
        size: file.size,
        type: file.mimeType,
        uri: file.uri ? file.uri.substring(0, 50) + '...' : 'no uri'
      });

      // Validate file size
      if (file.size && file.size > this.maxFileSize) {
        console.error('❌ DocumentStorageService: File size exceeds limit:', file.size, 'vs', this.maxFileSize);
        return {
          success: false,
          error: `File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`
        };
      }

      console.log('📁 DocumentStorageService: File validation passed, proceeding to upload');
      // Upload to Supabase
      return await this.uploadDocument(userId, file);

    } catch (error: any) {
      console.error('❌ DocumentStorageService: Document picker error:', error);
      console.error('❌ DocumentStorageService: Error stack:', error.stack);
      console.error('❌ DocumentStorageService: Error type:', typeof error);
      console.error('❌ DocumentStorageService: Error message:', error.message);

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
    console.log('⬆️ DocumentStorageService: uploadDocument called');
    console.log('⬆️ DocumentStorageService: userId:', userId);
    console.log('⬆️ DocumentStorageService: file name:', file.name);
    console.log('⬆️ DocumentStorageService: file size:', file.size);
    console.log('⬆️ DocumentStorageService: file type:', file.mimeType);

    try {
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      console.log('⬆️ DocumentStorageService: Generated fileName:', fileName);
      let fileData: any;

      console.log('⬆️ DocumentStorageService: Platform check for file reading:', Platform.OS);

      // Read file data based on platform
      if (Platform.OS === 'web') {
        console.log('🌐 DocumentStorageService: Reading file as blob for web platform');
        console.log('🌐 DocumentStorageService: File URI:', file.uri);

        const response = await fetch(file.uri);
        console.log('🌐 DocumentStorageService: Fetch response status:', response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        fileData = await response.blob();
        console.log('🌐 DocumentStorageService: Blob created successfully, size:', fileData.size);
      } else {
        console.log('📱 DocumentStorageService: Reading file as base64 for mobile platform');
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileData = base64;
        console.log('📱 DocumentStorageService: Base64 data length:', base64.length);
      }

      // Check if we should use local storage fallback
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
      const useLocalFallback = supabaseUrl === 'https://placeholder.supabase.co' || Platform.OS === 'web';

      if (useLocalFallback) {
        console.log('🏠 DocumentStorageService: Using local storage fallback (Supabase not configured)');

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

          console.log('✅ DocumentStorageService: Document stored locally successfully');
          console.log('📄 DocumentStorageService: Local document:', mockDocument);

          return {
            success: true,
            document: mockDocument,
          };
        } catch (localError) {
          console.error('❌ DocumentStorageService: Local storage failed:', localError);
          throw new Error('Failed to store document locally');
        }
      } else {
        // Original Supabase upload flow
        console.log('☁️ DocumentStorageService: Using Supabase storage');

        // Test bucket access first
        console.log('🪣 DocumentStorageService: Testing bucket access...');
        const { data: bucketTest, error: bucketError } = await Promise.race([
          supabase.storage.from(this.bucketName).list('', { limit: 1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Bucket test timeout')), 10000))
        ]) as any;

        if (bucketError) {
          console.error('❌ DocumentStorageService: Bucket access error:', bucketError);
          throw new Error(`Storage bucket '${this.bucketName}' access failed: ${bucketError.message}`);
        }

        console.log('✅ DocumentStorageService: Bucket access confirmed, proceeding with upload');

        // Upload file to Supabase
        console.log('⬆️ DocumentStorageService: Starting file upload to bucket:', this.bucketName);
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
          console.error('❌ DocumentStorageService: Upload error:', uploadError);
          throw uploadError;
        }

        console.log('✅ DocumentStorageService: Upload successful, getting public URL...');

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(fileName);

        console.log('🔗 DocumentStorageService: Public URL generated:', urlData.publicUrl);

        // Store document metadata in database
        console.log('💾 DocumentStorageService: Storing document metadata...');
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
          console.error('❌ DocumentStorageService: Database insert failed:', dbError);
          // Clean up uploaded file if database insert fails
          await supabase.storage
            .from(this.bucketName)
            .remove([fileName]);
          throw dbError;
        }

        console.log('✅ DocumentStorageService: Upload and metadata storage completed successfully');
        return {
          success: true,
          document: docData,
        };
      }

    } catch (error: any) {
      console.error('❌ DocumentStorageService: Upload error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(userId: string): Promise<StoredDocument[]> {
    console.log('📄 DocumentStorageService: getUserDocuments called with userId:', userId);

    try {
      console.log('📄 DocumentStorageService: About to query documents table');
      console.log('📄 DocumentStorageService: Supabase client check:', !!supabase);

      // Check if Supabase is properly configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
      console.log('📄 DocumentStorageService: Supabase URL:', supabaseUrl);

      if (supabaseUrl === 'https://placeholder.supabase.co' || Platform.OS === 'web') {
        console.warn('📄 DocumentStorageService: Using local storage fallback for documents');

        // Get documents from localStorage
        try {
          const storedDocs = localStorage.getItem('regattaflow_documents');
          if (storedDocs) {
            const documents = JSON.parse(storedDocs);
            // Filter by userId
            const userDocs = documents.filter((doc: StoredDocument) => doc.user_id === userId);
            console.log('📄 DocumentStorageService: Found', userDocs.length, 'local documents');
            return userDocs;
          }
        } catch (localError) {
          console.error('📄 DocumentStorageService: Error reading local storage:', localError);
        }

        return [];
      }

      // Test Supabase connection first with timeout
      try {
        console.log('📄 DocumentStorageService: Testing Supabase connection...');

        const connectionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection test timeout after 5 seconds')), 5000);
        });

        const connectionResult = await Promise.race([connectionPromise, timeoutPromise]);
        const { data: connectionTest, error: connectionError } = connectionResult as any;

        console.log('📄 DocumentStorageService: Connection test result:', {
          hasSession: !!connectionTest?.session,
          connectionError: connectionError?.message
        });
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

      console.log('📄 DocumentStorageService: Query promise created, awaiting response...');

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
      });

      // Race the query against timeout
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result as any;

      console.log('📄 DocumentStorageService: Query completed', {
        data: data?.length || 0,
        error,
        hasData: !!data,
        errorCode: error?.code,
        errorMessage: error?.message
      });

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

      console.log('📄 DocumentStorageService: Returning', data?.length || 0, 'documents');
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
        console.log('🏠 DocumentStorageService: Deleting document from local storage');

        const storedDocs = localStorage.getItem('regattaflow_documents');
        if (storedDocs) {
          const documents = JSON.parse(storedDocs);
          const filteredDocs = documents.filter((doc: StoredDocument) =>
            doc.id !== documentId || doc.user_id !== userId
          );
          localStorage.setItem('regattaflow_documents', JSON.stringify(filteredDocs));
          console.log('✅ DocumentStorageService: Document deleted from local storage');
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