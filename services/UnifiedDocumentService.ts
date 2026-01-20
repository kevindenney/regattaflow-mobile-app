/**
 * UnifiedDocumentService
 *
 * Unified service for managing race source documents with provenance tracking.
 * Handles document storage, AI extraction, and field provenance.
 */

import { supabase } from './supabase';
import { ComprehensiveRaceExtractionAgent } from './agents/ComprehensiveRaceExtractionAgent';
import { PDFExtractionService } from './PDFExtractionService';

// =============================================================================
// TYPES
// =============================================================================

export type DocumentSourceType = 'url' | 'upload' | 'paste';

export type DocumentType = 'nor' | 'si' | 'amendment' | 'appendix' | 'course_diagram' | 'other';

export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentSource {
  type: DocumentSourceType;
  url?: string;
  file?: {
    uri: string;
    name: string;
    size?: number;
  };
  pastedContent?: string;
}

export interface RaceSourceDocument {
  id: string;
  regattaId?: string;
  userId: string;
  sourceType: DocumentSourceType;
  sourceUrl?: string;
  filePath?: string;
  pastedContentHash?: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  versionNumber: number;
  supersedesId?: string;
  effectiveDate?: string;
  extractionStatus: ExtractionStatus;
  extractedData?: Record<string, unknown>;
  contributedFields?: string[];
  extractionError?: string;
  extractedAt?: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RaceSourceDocumentRow {
  id: string;
  regatta_id: string | null;
  user_id: string;
  source_type: string;
  source_url: string | null;
  file_path: string | null;
  pasted_content_hash: string | null;
  document_type: string;
  title: string;
  description: string | null;
  version_number: number;
  supersedes_id: string | null;
  effective_date: string | null;
  extraction_status: string;
  extracted_data: Record<string, unknown> | null;
  contributed_fields: string[] | null;
  extraction_error: string | null;
  extracted_at: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface FieldProvenance {
  id: string;
  regattaId: string;
  sourceDocumentId: string;
  fieldPath: string;
  fieldValue: unknown;
  extractionConfidence?: number;
  userVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  extractedAt: string;
}

export interface FieldProvenanceRow {
  id: string;
  regatta_id: string;
  source_document_id: string;
  field_path: string;
  field_value: unknown;
  extraction_confidence: number | null;
  user_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  extracted_at: string;
}

export interface AddDocumentParams {
  regattaId?: string;
  userId: string;
  source: DocumentSource;
  documentType: DocumentType;
  title?: string;
  description?: string;
  effectiveDate?: string;
  isShared?: boolean;
  triggerExtraction?: boolean;
}

export interface AddAmendmentParams {
  supersedesId: string;
  source: DocumentSource;
  title?: string;
  effectiveDate?: string;
}

export interface ApplyExtractionParams {
  regattaId: string;
  documentId: string;
  extractedData: Record<string, unknown>;
  fieldConfidence?: Record<string, number>;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function rowToDocument(row: RaceSourceDocumentRow): RaceSourceDocument {
  return {
    id: row.id,
    regattaId: row.regatta_id || undefined,
    userId: row.user_id,
    sourceType: row.source_type as DocumentSourceType,
    sourceUrl: row.source_url || undefined,
    filePath: row.file_path || undefined,
    pastedContentHash: row.pasted_content_hash || undefined,
    documentType: row.document_type as DocumentType,
    title: row.title,
    description: row.description || undefined,
    versionNumber: row.version_number,
    supersedesId: row.supersedes_id || undefined,
    effectiveDate: row.effective_date || undefined,
    extractionStatus: row.extraction_status as ExtractionStatus,
    extractedData: row.extracted_data || undefined,
    contributedFields: row.contributed_fields || undefined,
    extractionError: row.extraction_error || undefined,
    extractedAt: row.extracted_at || undefined,
    isShared: row.is_shared,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProvenance(row: FieldProvenanceRow): FieldProvenance {
  return {
    id: row.id,
    regattaId: row.regatta_id,
    sourceDocumentId: row.source_document_id,
    fieldPath: row.field_path,
    fieldValue: row.field_value,
    extractionConfidence: row.extraction_confidence || undefined,
    userVerified: row.user_verified,
    verifiedAt: row.verified_at || undefined,
    verifiedBy: row.verified_by || undefined,
    extractedAt: row.extracted_at,
  };
}

async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateTitleFromSource(source: DocumentSource, documentType: DocumentType): string {
  const typeLabels: Record<DocumentType, string> = {
    nor: 'Notice of Race',
    si: 'Sailing Instructions',
    amendment: 'Amendment',
    appendix: 'Appendix',
    course_diagram: 'Course Diagram',
    other: 'Document',
  };

  const baseTitle = typeLabels[documentType];

  if (source.type === 'url' && source.url) {
    // Try to extract filename from URL
    try {
      const url = new URL(source.url);
      const pathname = url.pathname;
      const filename = pathname.split('/').pop();
      if (filename && filename.includes('.')) {
        return filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      }
    } catch {
      // Invalid URL, use default
    }
  }

  if (source.type === 'upload' && source.file?.name) {
    return source.file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  }

  return baseTitle;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class UnifiedDocumentService {
  /**
   * Add a new document from any source
   */
  static async addDocument(params: AddDocumentParams): Promise<RaceSourceDocument> {
    const {
      regattaId,
      userId,
      source,
      documentType,
      title,
      description,
      effectiveDate,
      isShared = false,
      triggerExtraction = true,
    } = params;

    // Prepare document data based on source type
    let sourceUrl: string | null = null;
    let filePath: string | null = null;
    let pastedContentHash: string | null = null;

    if (source.type === 'url') {
      if (!source.url) throw new Error('URL is required for url source type');
      sourceUrl = source.url;
    } else if (source.type === 'upload') {
      if (!source.file) throw new Error('File is required for upload source type');
      // Upload file to storage
      const { uri, name } = source.file;
      const fileExt = name.split('.').pop() || 'pdf';
      const fileName = `${userId}/${Date.now()}_${name}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('race-documents')
        .upload(fileName, blob, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      filePath = fileName;
    } else if (source.type === 'paste') {
      if (!source.pastedContent) throw new Error('Content is required for paste source type');
      pastedContentHash = await hashContent(source.pastedContent);
    }

    // Generate title if not provided
    const documentTitle = title || generateTitleFromSource(source, documentType);

    // Insert document record
    const { data, error } = await supabase
      .from('race_source_documents')
      .insert({
        regatta_id: regattaId || null,
        user_id: userId,
        source_type: source.type,
        source_url: sourceUrl,
        file_path: filePath,
        pasted_content_hash: pastedContentHash,
        document_type: documentType,
        title: documentTitle,
        description: description || null,
        effective_date: effectiveDate || null,
        is_shared: isShared,
        extraction_status: triggerExtraction ? 'pending' : 'completed',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }

    const document = rowToDocument(data as RaceSourceDocumentRow);

    // Trigger extraction if requested
    if (triggerExtraction) {
      // Don't await - let it run in background
      this.extractDocument(document.id, source).catch((err) => {
        console.error('[UnifiedDocumentService] Background extraction failed:', err);
      });
    }

    return document;
  }

  /**
   * Get all documents for a race
   */
  static async getRaceDocuments(regattaId: string): Promise<RaceSourceDocument[]> {
    const { data, error } = await supabase
      .from('race_source_documents')
      .select('*')
      .eq('regatta_id', regattaId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get documents: ${error.message}`);
    }

    return (data as RaceSourceDocumentRow[]).map(rowToDocument);
  }

  /**
   * Get a single document by ID
   */
  static async getDocument(documentId: string): Promise<RaceSourceDocument | null> {
    const { data, error } = await supabase
      .from('race_source_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get document: ${error.message}`);
    }

    return rowToDocument(data as RaceSourceDocumentRow);
  }

  /**
   * Get field provenance map for a race
   */
  static async getFieldProvenance(regattaId: string): Promise<Map<string, FieldProvenance>> {
    const { data, error } = await supabase
      .from('field_provenance')
      .select('*')
      .eq('regatta_id', regattaId);

    if (error) {
      throw new Error(`Failed to get field provenance: ${error.message}`);
    }

    const map = new Map<string, FieldProvenance>();
    for (const row of data as FieldProvenanceRow[]) {
      map.set(row.field_path, rowToProvenance(row));
    }

    return map;
  }

  /**
   * Add an amendment to an existing document
   */
  static async addAmendment(params: AddAmendmentParams): Promise<RaceSourceDocument> {
    const { supersedesId, source, title, effectiveDate } = params;

    // Get the original document
    const original = await this.getDocument(supersedesId);
    if (!original) {
      throw new Error('Original document not found');
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Calculate next version number
    const { data: versions } = await supabase
      .from('race_source_documents')
      .select('version_number')
      .or(`id.eq.${supersedesId},supersedes_id.eq.${supersedesId}`)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 1) + 1;

    // Prepare document data
    let sourceUrl: string | null = null;
    let filePath: string | null = null;
    let pastedContentHash: string | null = null;

    if (source.type === 'url') {
      sourceUrl = source.url || null;
    } else if (source.type === 'upload' && source.file) {
      const { uri, name } = source.file;
      const fileName = `${user.id}/${Date.now()}_${name}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('race-documents')
        .upload(fileName, blob, {
          contentType: 'application/pdf',
        });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      filePath = fileName;
    } else if (source.type === 'paste' && source.pastedContent) {
      pastedContentHash = await hashContent(source.pastedContent);
    }

    // Insert amendment record
    const { data, error } = await supabase
      .from('race_source_documents')
      .insert({
        regatta_id: original.regattaId || null,
        user_id: user.id,
        source_type: source.type,
        source_url: sourceUrl,
        file_path: filePath,
        pasted_content_hash: pastedContentHash,
        document_type: 'amendment',
        title: title || `Amendment ${nextVersion - 1}`,
        version_number: nextVersion,
        supersedes_id: supersedesId,
        effective_date: effectiveDate || null,
        is_shared: original.isShared,
        extraction_status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create amendment: ${error.message}`);
    }

    const document = rowToDocument(data as RaceSourceDocumentRow);

    // Trigger extraction
    this.extractDocument(document.id, source).catch((err) => {
      console.error('[UnifiedDocumentService] Amendment extraction failed:', err);
    });

    return document;
  }

  /**
   * Apply extraction results to a race with provenance tracking
   */
  static async applyExtractionToRace(params: ApplyExtractionParams): Promise<void> {
    const { regattaId, documentId, extractedData, fieldConfidence = {} } = params;

    // Build provenance records for each extracted field
    const provenanceRecords: Array<{
      regatta_id: string;
      source_document_id: string;
      field_path: string;
      field_value: unknown;
      extraction_confidence: number | null;
    }> = [];

    const contributedFields: string[] = [];

    // Flatten extracted data into field paths
    function extractFields(obj: Record<string, unknown>, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          extractFields(value as Record<string, unknown>, path);
        } else if (value !== null && value !== undefined && value !== '') {
          provenanceRecords.push({
            regatta_id: regattaId,
            source_document_id: documentId,
            field_path: path,
            field_value: value,
            extraction_confidence: fieldConfidence[path] || null,
          });
          contributedFields.push(path);
        }
      }
    }

    extractFields(extractedData);

    // Upsert provenance records (later document wins)
    if (provenanceRecords.length > 0) {
      const { error: provenanceError } = await supabase
        .from('field_provenance')
        .upsert(provenanceRecords, {
          onConflict: 'regatta_id,field_path',
        });

      if (provenanceError) {
        console.error('[UnifiedDocumentService] Failed to upsert provenance:', provenanceError);
      }
    }

    // Update document with contributed fields
    await supabase
      .from('race_source_documents')
      .update({
        contributed_fields: contributedFields,
      })
      .eq('id', documentId);
  }

  /**
   * Check for duplicate documents
   */
  static async checkForDuplicate(
    regattaId: string | undefined,
    source: DocumentSource
  ): Promise<RaceSourceDocument | null> {
    if (!regattaId) return null;

    let query = supabase
      .from('race_source_documents')
      .select('*')
      .eq('regatta_id', regattaId);

    if (source.type === 'url' && source.url) {
      query = query.eq('source_url', source.url);
    } else if (source.type === 'paste' && source.pastedContent) {
      const hash = await hashContent(source.pastedContent);
      query = query.eq('pasted_content_hash', hash);
    } else {
      return null;
    }

    const { data } = await query.limit(1);

    if (data && data.length > 0) {
      return rowToDocument(data[0] as RaceSourceDocumentRow);
    }

    return null;
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId: string): Promise<void> {
    // Get document to check for file
    const doc = await this.getDocument(documentId);

    if (doc?.filePath) {
      // Delete file from storage
      await supabase.storage
        .from('race-documents')
        .remove([doc.filePath]);
    }

    // Delete document record (provenance will cascade)
    const { error } = await supabase
      .from('race_source_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  /**
   * Update document sharing status
   */
  static async updateSharingStatus(documentId: string, isShared: boolean): Promise<void> {
    const { error } = await supabase
      .from('race_source_documents')
      .update({ is_shared: isShared })
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to update sharing status: ${error.message}`);
    }
  }

  /**
   * Verify a field value (mark as user-verified)
   */
  static async verifyField(regattaId: string, fieldPath: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('field_provenance')
      .update({
        user_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('regatta_id', regattaId)
      .eq('field_path', fieldPath);

    if (error) {
      throw new Error(`Failed to verify field: ${error.message}`);
    }
  }

  /**
   * Internal: Extract content from a document
   */
  private static async extractDocument(documentId: string, source: DocumentSource): Promise<void> {
    try {
      // Update status to processing
      await supabase
        .from('race_source_documents')
        .update({ extraction_status: 'processing' })
        .eq('id', documentId);

      let textContent = '';

      // Get content based on source type
      if (source.type === 'url' && source.url) {
        const isPdfUrl = source.url.toLowerCase().includes('.pdf') ||
                         source.url.toLowerCase().includes('pdf=') ||
                         source.url.includes('_files/ugd/');

        if (isPdfUrl) {
          const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
          const extractUrl = `${supabaseUrl}/functions/v1/extract-pdf-text`;

          const extractResponse = await fetch(extractUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: source.url }),
          });

          const extractResult = await extractResponse.json();
          if (!extractResponse.ok || !extractResult.success) {
            throw new Error(extractResult.error || 'Failed to extract PDF');
          }
          textContent = extractResult.text;
        } else {
          const response = await fetch(source.url);
          textContent = await response.text();
        }
      } else if (source.type === 'upload' && source.file) {
        const pdfResult = await PDFExtractionService.extractText(source.file.uri, {
          maxPages: 50,
        });
        if (!pdfResult.success || !pdfResult.text) {
          throw new Error(pdfResult.error || 'Failed to extract PDF text');
        }
        textContent = pdfResult.text;
      } else if (source.type === 'paste' && source.pastedContent) {
        textContent = source.pastedContent;
      }

      if (textContent.length < 20) {
        throw new Error('Not enough content to extract');
      }

      // Run AI extraction
      const agent = new ComprehensiveRaceExtractionAgent();
      const result = await agent.extractRaceDetails(textContent);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Extraction failed');
      }

      // Update document with results
      await supabase
        .from('race_source_documents')
        .update({
          extraction_status: 'completed',
          extracted_data: result.data,
          extracted_at: new Date().toISOString(),
        })
        .eq('id', documentId);

    } catch (error) {
      console.error('[UnifiedDocumentService] Extraction error:', error);

      // Update document with error
      await supabase
        .from('race_source_documents')
        .update({
          extraction_status: 'failed',
          extraction_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', documentId);
    }
  }
}

export default UnifiedDocumentService;
