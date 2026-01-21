/**
 * UnifiedDocumentInput Component
 *
 * Unified document input for race creation and document management.
 * Replaces separate AI Extraction + SSI Upload sections with a single
 * cohesive experience.
 *
 * Features:
 * - Mobile-first: URL input primary (easy paste from email/browser)
 * - Smart content detection (URL vs text, document type)
 * - Source provenance tracking
 * - Support for incremental document addition
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { ChevronRight, ChevronDown, Sparkles, CheckCircle } from 'lucide-react-native';
import { TUFTE_FORM_COLORS, TUFTE_FORM_SPACING } from '@/components/races/AddRaceDialog/tufteFormStyles';
import { IOS_COLORS } from '@/components/cards/constants';

import { InputMethodTabs, type InputMethod } from './InputMethodTabs';
import { URLInput, type InputContentType } from './URLInput';
import { PasteInput } from './PasteInput';
import { PDFUpload, type SelectedFile } from './PDFUpload';
import { DocumentTypeSelector, type DocumentType } from './DocumentTypeSelector';
import { ExtractionProgress, type ExtractionStatus, type BatchProgress, type BatchUrlResult } from './ExtractionProgress';
import { DuplicateWarning } from './DuplicateWarning';

import { ComprehensiveRaceExtractionAgent } from '@/services/agents/ComprehensiveRaceExtractionAgent';
import { PDFExtractionService } from '@/services/PDFExtractionService';
import {
  UnifiedDocumentService,
  type RaceSourceDocument as ServiceRaceSourceDocument,
} from '@/services/UnifiedDocumentService';
import type { ExtractedRaceData } from '@/components/races/ExtractionResults';
import type { MultiRaceExtractedData, ExtractedData } from '@/components/races/AIValidationScreen';

// =============================================================================
// TYPES
// =============================================================================

export interface DocumentSource {
  type: 'url' | 'upload' | 'paste';
  url?: string;
  file?: SelectedFile;
  pastedContent?: string;
  contentHash?: string;
}

export interface RaceSourceDocument {
  id: string;
  regattaId?: string;
  sourceType: 'url' | 'upload' | 'paste';
  sourceUrl?: string;
  filePath?: string;
  pastedContentHash?: string;
  documentType: DocumentType;
  title: string;
  extractionStatus: ExtractionStatus;
  extractedData?: any;
  contributedFields?: string[];
}

export interface UnifiedDocumentInputProps {
  /** Regatta ID if adding to existing race */
  regattaId?: string;
  /** Mode of operation */
  mode: 'race_creation' | 'document_management';
  /** Default document type selection */
  defaultDocumentType?: DocumentType;
  /** Callback when extraction completes successfully */
  onExtractionComplete?: (data: ExtractedRaceData, rawData?: any, documentId?: string) => void;
  /** Callback when multiple races are detected */
  onMultiRaceDetected?: (data: MultiRaceExtractedData) => void;
  /** Callback when document is added (before extraction) */
  onDocumentAdded?: (document: RaceSourceDocument) => void;
  /** Compact mode for inline usage */
  compact?: boolean;
  /** Initial expanded state */
  initialExpanded?: boolean;
  /** Currently selected race type (for extraction context) */
  raceType?: string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function transformExtractionResult(result: any, raceType: string): ExtractedRaceData {
  const createField = (
    label: string,
    value: string | undefined | null,
    confidence: 'high' | 'medium' | 'low' | 'missing' = 'medium'
  ) => ({
    label,
    value: value || '',
    confidence: value ? confidence : 'missing',
    editable: true,
  });

  // Get VHF channel
  const getVhfChannel = () => {
    if (result.vhfChannel) return result.vhfChannel;
    if (result.vhfChannels && result.vhfChannels.length > 0) {
      return result.vhfChannels.map((v: { channel: string; purpose?: string }) =>
        v.purpose ? `Ch ${v.channel} (${v.purpose})` : `Ch ${v.channel}`
      ).join(', ');
    }
    return undefined;
  };

  return {
    basic: [
      createField('Race Name', result.raceName || result.race_name, result.raceName ? 'high' : 'missing'),
      createField('Date', result.raceDate || result.date, result.raceDate || result.date ? 'high' : 'missing'),
      createField('Start Time', result.warningSignalTime || result.startTime, 'medium'),
      createField('Location', result.venue || result.location, result.venue ? 'high' : 'medium'),
      createField('Organizing Authority', result.organizingAuthority, 'medium'),
    ],
    timing: [
      createField('First Warning', result.warningSignalTime, 'medium'),
      createField('Race Series', result.raceSeriesName, 'medium'),
    ],
    course: raceType === 'distance'
      ? [
          createField('Total Distance (nm)', result.totalDistanceNm?.toString(), 'medium'),
          createField('Time Limit (hours)', result.timeLimitHours?.toString(), 'medium'),
          createField('Route Description', result.courseDescription, 'medium'),
        ]
      : [
          createField('Course Type', result.courseType, 'medium'),
          createField('Expected Fleet Size', result.expectedFleetSize?.toString(), 'low'),
          createField('Boat Class', result.boatClass, result.boatClass ? 'high' : 'medium'),
        ],
    conditions: [
      createField('VHF Channel', getVhfChannel(), 'medium'),
      createField('Weather Notes', result.expectedConditions, 'low'),
    ],
  };
}

async function hashContent(content: string): Promise<string> {
  // Simple hash for deduplication
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Document types that need COURSE extraction (marks, sequence, not race details)
const COURSE_DOCUMENT_TYPES = ['course_diagram', 'courses'];

// Helper function to count extracted course fields
function countCourseFields(data: any): number {
  if (!data) return 0;

  let count = 0;

  // Multiple courses format
  if (data.courses && Array.isArray(data.courses)) {
    for (const course of data.courses) {
      if (course.name) count++;
      if (course.marks?.length) count += course.marks.length;
      if (course.sequence?.length) count++;
      if (course.courseType) count++;
      if (course.laps) count++;
    }
    if (data.windDirection) count++;
    return count;
  }

  // Single course format
  if (data.marks?.length) count += data.marks.length;
  if (data.sequence?.length) count++;
  if (data.windDirection) count++;
  if (data.courseType) count++;
  if (data.laps) count++;
  if (data.notes?.length) count += data.notes.length;

  return count;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function UnifiedDocumentInput({
  regattaId,
  mode = 'race_creation',
  defaultDocumentType = 'nor',
  onExtractionComplete,
  onMultiRaceDetected,
  onDocumentAdded,
  compact = false,
  initialExpanded = false,
  raceType = 'fleet',
}: UnifiedDocumentInputProps) {
  // State
  const [expanded, setExpanded] = useState(initialExpanded);
  const [activeMethod, setActiveMethod] = useState<InputMethod>('url');
  const [documentType, setDocumentType] = useState<DocumentType>(defaultDocumentType);

  // Input states
  const [urlValue, setUrlValue] = useState('');
  const [pasteValue, setPasteValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  // Multi-URL tracking
  const [detectedUrls, setDetectedUrls] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);

  // URL input content type tracking (urls vs pasted text)
  const [urlInputContentType, setUrlInputContentType] = useState<InputContentType>('empty');
  const [urlInputTextContent, setUrlInputTextContent] = useState<string>('');

  // Extraction states
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus>('idle');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const [extractedFieldCount, setExtractedFieldCount] = useState<number | undefined>();

  // Document source for provenance
  const [currentSource, setCurrentSource] = useState<DocumentSource | null>(null);

  // Duplicate detection state
  const [duplicateDocument, setDuplicateDocument] = useState<ServiceRaceSourceDocument | null>(null);
  const [pendingSource, setPendingSource] = useState<DocumentSource | null>(null);

  // Auto-detect document type from content
  const handleUrlAutoDetect = useCallback((info: { isPdf: boolean; suggestedType?: string }) => {
    if (info.suggestedType) {
      setDocumentType(info.suggestedType as DocumentType);
    }
  }, []);

  const handleFileAutoDetect = useCallback((info: { suggestedType?: string }) => {
    if (info.suggestedType) {
      setDocumentType(info.suggestedType as DocumentType);
    }
  }, []);

  // Handle URL detected in paste input (switch to URL tab)
  const handleUrlDetected = useCallback((url: string) => {
    setUrlValue(url);
    setPasteValue('');
    setActiveMethod('url');
  }, []);

  // Handle URLs detected from URL input (for multi-URL support)
  const handleUrlsDetected = useCallback((urls: string[]) => {
    setDetectedUrls(urls);
  }, []);

  // Handle text content detected in URL input (user pasted document text instead of URLs)
  const handleTextContentDetected = useCallback((text: string) => {
    setUrlInputTextContent(text);
  }, []);

  // Handle content type change in URL input
  // Only update the content type state - let the individual handlers clear their respective states
  const handleContentTypeChange = useCallback((type: InputContentType) => {
    setUrlInputContentType(type);
  }, []);

  // Check if we can extract
  const canExtract = useCallback(() => {
    if (activeMethod === 'url') {
      // Allow extraction if we have URLs OR substantial text content pasted
      return detectedUrls.length > 0 || (urlInputContentType === 'text' && urlInputTextContent.trim().length > 20);
    }
    if (activeMethod === 'paste') return pasteValue.trim().length >= 20;
    if (activeMethod === 'upload') return selectedFile !== null;
    return false;
  }, [activeMethod, detectedUrls, pasteValue, selectedFile, urlInputContentType, urlInputTextContent]);

  // Check for duplicates before extraction
  const checkForDuplicate = useCallback(async (source: DocumentSource): Promise<ServiceRaceSourceDocument | null> => {
    if (!regattaId || mode === 'race_creation') {
      return null; // No duplicate check for new races
    }

    try {
      return await UnifiedDocumentService.checkForDuplicate(regattaId, {
        type: source.type,
        url: source.url,
        pastedContent: source.pastedContent,
      });
    } catch (error) {
      console.error('[UnifiedDocumentInput] Duplicate check failed:', error);
      return null;
    }
  }, [regattaId, mode]);

  // Helper function to extract from a single URL
  const extractFromUrl = useCallback(async (url: string): Promise<{
    success: boolean;
    textContent?: string;
    error?: string;
  }> => {
    try {
      // Check if URL is a PDF
      const isPdfUrl = url.toLowerCase().includes('.pdf') ||
                       url.toLowerCase().includes('pdf=') ||
                       url.includes('_files/ugd/');

      let textContent = '';

      if (isPdfUrl) {
        // Use server-side PDF extraction
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const extractUrl = `${supabaseUrl}/functions/v1/extract-pdf-text`;

        const extractResponse = await fetch(extractUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        const extractResult = await extractResponse.json();

        if (!extractResponse.ok || !extractResult.success) {
          return { success: false, error: extractResult.error || `Failed to extract PDF: ${extractResponse.status}` };
        }

        textContent = extractResult.text;
      } else {
        // Non-PDF URL - try direct fetch
        const response = await fetch(url);
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('pdf')) {
          // Retry as PDF
          const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
          const extractUrl = `${supabaseUrl}/functions/v1/extract-pdf-text`;

          const extractResponse = await fetch(extractUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          const extractResult = await extractResponse.json();

          if (!extractResponse.ok || !extractResult.success) {
            return { success: false, error: extractResult.error || 'Failed to extract PDF' };
          }

          textContent = extractResult.text;
        } else {
          textContent = await response.text();
        }
      }

      if (textContent.length < 20) {
        return { success: false, error: 'Not enough content to extract race details' };
      }

      return { success: true, textContent };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch URL' };
    }
  }, []);

  // Handler for course diagram/courses extraction using vision
  const handleCourseExtraction = useCallback(async (source: DocumentSource) => {
    setExtractionStatus('fetching');
    setExtractionError(null);
    setBatchProgress(null);

    try {
      let base64Data: string = '';
      let isPdf = false;
      let fileName = 'course document';

      if (source.type === 'url') {
        // Fetch document and convert to base64
        const url = source.url!;
        fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'course.pdf');
        isPdf = url.toLowerCase().includes('.pdf') ||
                url.toLowerCase().includes('pdf=') ||
                url.includes('_files/ugd/');

        // Use pdf-proxy to fetch the document (GET request with URL param)
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const proxyUrl = `${supabaseUrl}/functions/v1/pdf-proxy?url=${encodeURIComponent(url)}`;

        const proxyResponse = await fetch(proxyUrl, {
          headers: {
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        });

        if (!proxyResponse.ok) {
          // Check if response is JSON with error message
          const contentType = proxyResponse.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await proxyResponse.json();
            throw new Error(errorData.error || `Failed to fetch document: ${proxyResponse.status}`);
          }
          throw new Error(`Failed to fetch document: ${proxyResponse.status}`);
        }

        // Check if response is PDF based on header
        const responseContentType = proxyResponse.headers.get('content-type') || '';
        const isPdfHeader = proxyResponse.headers.get('x-pdf-detected') === 'true';
        if (responseContentType.includes('pdf') || isPdfHeader) {
          isPdf = true;
        }

        // Convert binary response to base64
        const arrayBuffer = await proxyResponse.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Convert to base64 - handle both web and native
        if (Platform.OS === 'web') {
          // Web: use btoa with binary string
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          base64Data = btoa(binary);
        } else {
          // Native: use Buffer or manual conversion
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
          let result = '';
          for (let i = 0; i < bytes.length; i += 3) {
            const a = bytes[i];
            const b = bytes[i + 1] ?? 0;
            const c = bytes[i + 2] ?? 0;
            result += chars[a >> 2];
            result += chars[((a & 3) << 4) | (b >> 4)];
            result += i + 1 < bytes.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
            result += i + 2 < bytes.length ? chars[c & 63] : '=';
          }
          base64Data = result;
        }
      } else if (source.type === 'upload' && source.file) {
        // Read uploaded file as base64
        fileName = source.file.name;
        isPdf = source.file.mimeType?.includes('pdf') ||
                source.file.name.toLowerCase().endsWith('.pdf');

        // Read file using fetch for web or FileSystem for native
        if (Platform.OS === 'web') {
          const response = await fetch(source.file.uri);
          const blob = await response.blob();
          base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove data URL prefix if present
              const base64 = result.includes('base64,')
                ? result.split('base64,')[1]
                : result;
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          // Native - use expo-file-system
          const FileSystem = require('expo-file-system/legacy');
          base64Data = await FileSystem.readAsStringAsync(source.file.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      } else {
        throw new Error('Paste input not supported for course extraction - please use URL or upload');
      }

      setExtractionStatus('extracting');

      // Call extract-course-image edge function with PDF or image
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const extractUrl = `${supabaseUrl}/functions/v1/extract-course-image`;

      const requestBody = isPdf
        ? { pdfBase64: base64Data }
        : { imageBase64: base64Data, mediaType: source.file?.mimeType || 'image/png' };

      const extractResponse = await fetch(extractUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await extractResponse.json();

      if (!result.success) {
        throw new Error(result.error || 'Course extraction failed');
      }

      setExtractionStatus('completed');
      setExtractionComplete(true);

      // Count extracted fields
      const fieldCount = countCourseFields(result.data);
      setExtractedFieldCount(fieldCount);

      // Store the source for provenance
      setCurrentSource(source);

      // Notify parent with course data
      if (onDocumentAdded) {
        onDocumentAdded({
          id: crypto.randomUUID(),
          regattaId,
          sourceType: source.type,
          sourceUrl: source.url,
          documentType,
          title: fileName,
          extractionStatus: 'completed',
          extractedData: result.data,
        });
      }

      // Collapse after short delay
      setTimeout(() => setExpanded(false), 500);

    } catch (err) {
      console.error('[UnifiedDocumentInput] Course extraction error:', err);
      setExtractionStatus('failed');
      setExtractionError(err instanceof Error ? err.message : 'Course extraction failed');
    }
  }, [regattaId, documentType, onDocumentAdded]);

  // Document types that don't need any extraction - just save the document
  const NON_RACE_DOCUMENT_TYPES = ['appendix', 'other'];

  // Main extraction handler
  const handleExtract = useCallback(async (skipDuplicateCheck = false) => {
    if (!canExtract() || extractionStatus === 'fetching' || extractionStatus === 'extracting') {
      return;
    }

    // Route course document types to course-specific extraction (uses vision for PDFs/images)
    if (COURSE_DOCUMENT_TYPES.includes(documentType)) {
      // Build the source for course extraction
      let source: DocumentSource;
      if (activeMethod === 'url') {
        source = { type: 'url', url: detectedUrls[0] || urlValue.trim() };
      } else if (activeMethod === 'upload' && selectedFile) {
        source = { type: 'upload', file: selectedFile };
      } else if (activeMethod === 'paste') {
        // Course extraction doesn't support paste
        setExtractionError('Paste input is not supported for course documents. Please use URL or upload.');
        setExtractionStatus('failed');
        return;
      } else {
        return;
      }

      await handleCourseExtraction(source);
      return;
    }

    // Skip AI extraction for non-race document types - just save the document
    if (NON_RACE_DOCUMENT_TYPES.includes(documentType)) {
      // Build the source for provenance
      let source: DocumentSource;
      if (activeMethod === 'url') {
        source = { type: 'url', url: detectedUrls[0] || urlValue.trim() };
      } else if (activeMethod === 'paste') {
        const hash = await hashContent(pasteValue.trim());
        source = { type: 'paste', pastedContent: pasteValue.trim(), contentHash: hash };
      } else if (activeMethod === 'upload' && selectedFile) {
        source = { type: 'upload', file: selectedFile };
      } else {
        return;
      }

      setCurrentSource(source);
      setExtractionStatus('completed');
      setExtractionComplete(true);
      setExtractedFieldCount(0);

      // Notify parent that document was added (without race data)
      if (onDocumentAdded) {
        onDocumentAdded({
          id: crypto.randomUUID(),
          regattaId,
          sourceType: source.type,
          sourceUrl: source.url,
          documentType,
          title: source.file?.name || source.url || 'Document',
          extractionStatus: 'completed',
        });
      }

      // Collapse after short delay
      setTimeout(() => setExpanded(false), 500);
      return;
    }

    // Handle text content pasted into URL input (treat like paste input)
    if (activeMethod === 'url' && urlInputContentType === 'text' && urlInputTextContent.trim()) {
      const textContent = urlInputTextContent.trim();
      const hash = await hashContent(textContent);
      const source: DocumentSource = { type: 'paste', pastedContent: textContent, contentHash: hash };

      // Check for duplicates (unless explicitly skipped)
      if (!skipDuplicateCheck && regattaId && mode === 'document_management') {
        const existing = await checkForDuplicate(source);
        if (existing) {
          setDuplicateDocument(existing);
          setPendingSource(source);
          return;
        }
      }

      setExtractionStatus('extracting');
      setExtractionError(null);
      setBatchProgress(null);
      setCurrentSource(source);

      try {
        const agent = new ComprehensiveRaceExtractionAgent();
        const result = await agent.extractRaceDetails(textContent);

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to extract race details');
        }

        // Check for multi-race detection
        if (result.data.multipleRaces && result.data.races && result.data.races.length > 1) {
          if (onMultiRaceDetected) {
            const enrichedData = {
              ...result.data,
              sourceTracking: {
                documentType,
                sourceType: source.type,
              },
            };
            setExtractionStatus('completed');
            setExtractionComplete(true);
            onMultiRaceDetected(enrichedData as MultiRaceExtractedData);
            return;
          }
        }

        // Single race extraction
        const raceData = result.data.races?.[0] || result.data;
        const extractedData = transformExtractionResult(raceData, raceType);

        // Count extracted fields
        const fieldCount = Object.values(extractedData)
          .flat()
          .filter((f: any) => f.value && f.confidence !== 'missing').length;
        setExtractedFieldCount(fieldCount);

        setExtractionStatus('completed');
        setExtractionComplete(true);

        if (onExtractionComplete) {
          onExtractionComplete(extractedData, {
            ...raceData,
            sourceTracking: {
              documentType,
              sourceType: source.type,
            },
          });
        }

        setTimeout(() => setExpanded(false), 500);
      } catch (err) {
        setExtractionStatus('failed');
        setExtractionError(err instanceof Error ? err.message : 'Extraction failed');
      }
      return;
    }

    // Handle multi-URL extraction for URL input method
    if (activeMethod === 'url' && detectedUrls.length > 1) {
      // Batch extraction mode
      setExtractionStatus('fetching');
      setExtractionError(null);
      setBatchProgress({
        current: 1,
        total: detectedUrls.length,
        results: detectedUrls.map(url => ({ url, success: false })),
      });

      const results: BatchUrlResult[] = [];
      let totalFieldCount = 0;
      let hasAnySuccess = false;

      for (let i = 0; i < detectedUrls.length; i++) {
        const url = detectedUrls[i];

        // Update batch progress - fetching
        setBatchProgress(prev => prev ? {
          ...prev,
          current: i + 1,
          results: [...results, { url, success: false }],
        } : null);
        setExtractionStatus('fetching');

        // Fetch content
        const fetchResult = await extractFromUrl(url);

        if (!fetchResult.success || !fetchResult.textContent) {
          results.push({ url, success: false, error: fetchResult.error });
          continue;
        }

        // Update status to extracting
        setExtractionStatus('extracting');

        // AI extraction
        try {
          const agent = new ComprehensiveRaceExtractionAgent();
          const result = await agent.extractRaceDetails(fetchResult.textContent);

          if (!result.success || !result.data) {
            results.push({ url, success: false, error: result.error || 'Extraction failed' });
            continue;
          }

          // Check for multi-race detection (for the first URL only, to avoid complexity)
          if (i === 0 && result.data.multipleRaces && result.data.races && result.data.races.length > 1) {
            if (onMultiRaceDetected) {
              const source: DocumentSource = { type: 'url', url };
              const enrichedData = {
                ...result.data,
                sourceTracking: {
                  documentType,
                  sourceType: source.type,
                  sourceUrl: source.url,
                },
              };
              // Note: We continue processing other URLs even if first has multiple races
              onMultiRaceDetected(enrichedData as MultiRaceExtractedData);
            }
          }

          // Transform and count fields
          const raceData = result.data.races?.[0] || result.data;
          const extractedData = transformExtractionResult(raceData, raceType);
          const fieldCount = Object.values(extractedData)
            .flat()
            .filter((f: any) => f.value && f.confidence !== 'missing').length;

          results.push({ url, success: true, extractedFieldCount: fieldCount });
          totalFieldCount += fieldCount;
          hasAnySuccess = true;

          // Call the callback for each successful extraction
          if (onExtractionComplete) {
            const source: DocumentSource = { type: 'url', url };
            setCurrentSource(source);
            onExtractionComplete(extractedData, {
              ...raceData,
              sourceTracking: {
                documentType,
                sourceType: source.type,
                sourceUrl: source.url,
              },
            });
          }
        } catch (err) {
          results.push({
            url,
            success: false,
            error: err instanceof Error ? err.message : 'Extraction failed',
          });
        }
      }

      // Finalize batch progress
      setBatchProgress({
        current: detectedUrls.length,
        total: detectedUrls.length,
        results,
      });

      setExtractedFieldCount(totalFieldCount);

      if (hasAnySuccess) {
        setExtractionStatus('completed');
        setExtractionComplete(true);

        // Collapse after short delay
        setTimeout(() => {
          setExpanded(false);
        }, 500);
      } else {
        setExtractionStatus('failed');
        setExtractionError('All URLs failed to extract');
      }

      return;
    }

    // Single URL/paste/upload extraction (original logic)
    let source: DocumentSource;
    if (activeMethod === 'url') {
      source = { type: 'url', url: detectedUrls[0] || urlValue.trim() };
    } else if (activeMethod === 'paste') {
      const hash = await hashContent(pasteValue.trim());
      source = { type: 'paste', pastedContent: pasteValue.trim(), contentHash: hash };
    } else if (activeMethod === 'upload' && selectedFile) {
      source = { type: 'upload', file: selectedFile };
    } else {
      return;
    }

    // Check for duplicates (unless explicitly skipped)
    if (!skipDuplicateCheck && regattaId && mode === 'document_management') {
      const existing = await checkForDuplicate(source);
      if (existing) {
        setDuplicateDocument(existing);
        setPendingSource(source);
        return; // Show duplicate warning instead of proceeding
      }
    }

    setExtractionStatus('fetching');
    setExtractionError(null);
    setBatchProgress(null); // Clear any batch progress for single extraction

    try {
      let textContent = '';

      // Get content based on input method
      if (activeMethod === 'url') {
        const url = source.url!;
        const fetchResult = await extractFromUrl(url);

        if (!fetchResult.success || !fetchResult.textContent) {
          throw new Error(fetchResult.error || 'Failed to fetch URL');
        }

        textContent = fetchResult.textContent;
      } else if (activeMethod === 'paste') {
        textContent = pasteValue.trim();
      } else if (activeMethod === 'upload' && selectedFile) {
        // Extract text from PDF
        const pdfResult = await PDFExtractionService.extractText(selectedFile.uri, {
          maxPages: 50,
        });

        if (!pdfResult.success || !pdfResult.text) {
          throw new Error(pdfResult.error || 'Failed to extract text from PDF');
        }

        textContent = pdfResult.text;
      } else {
        throw new Error('No content to extract');
      }

      if (textContent.length < 20) {
        throw new Error('Not enough content to extract race details');
      }

      // Store the source for provenance
      setCurrentSource(source);

      // Now do AI extraction
      setExtractionStatus('extracting');

      const agent = new ComprehensiveRaceExtractionAgent();
      const result = await agent.extractRaceDetails(textContent);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to extract race details');
      }

      // Check for multi-race detection
      if (result.data.multipleRaces && result.data.races && result.data.races.length > 1) {
        if (onMultiRaceDetected) {
          // Attach source info to the extraction result
          const enrichedData = {
            ...result.data,
            sourceTracking: {
              documentType,
              sourceType: source.type,
              sourceUrl: source.url,
            },
          };
          setExtractionStatus('completed');
          setExtractionComplete(true);
          onMultiRaceDetected(enrichedData as MultiRaceExtractedData);
          return;
        }
      }

      // Single race extraction
      const raceData = result.data.races?.[0] || result.data;
      const extractedData = transformExtractionResult(raceData, raceType);

      // Count extracted fields
      const fieldCount = Object.values(extractedData)
        .flat()
        .filter((f: any) => f.value && f.confidence !== 'missing').length;
      setExtractedFieldCount(fieldCount);

      setExtractionStatus('completed');
      setExtractionComplete(true);

      // Call the callback with source info
      if (onExtractionComplete) {
        onExtractionComplete(extractedData, {
          ...raceData,
          sourceTracking: {
            documentType,
            sourceType: source.type,
            sourceUrl: source.url,
          },
        });
      }

      // Collapse after short delay
      setTimeout(() => {
        setExpanded(false);
      }, 500);

    } catch (err) {
      setExtractionStatus('failed');
      setExtractionError(err instanceof Error ? err.message : 'Extraction failed');
    }
  }, [
    canExtract,
    extractionStatus,
    activeMethod,
    urlValue,
    detectedUrls,
    pasteValue,
    selectedFile,
    documentType,
    raceType,
    onExtractionComplete,
    onMultiRaceDetected,
    onDocumentAdded,
    checkForDuplicate,
    regattaId,
    mode,
    extractFromUrl,
    handleCourseExtraction,
    urlInputContentType,
    urlInputTextContent,
  ]);

  // Reset handler
  const handleReset = useCallback(() => {
    setExtractionStatus('idle');
    setExtractionError(null);
    setExtractionComplete(false);
    setExtractedFieldCount(undefined);
    setCurrentSource(null);
    setDuplicateDocument(null);
    setPendingSource(null);
    setBatchProgress(null);
    setUrlInputContentType('empty');
    setUrlInputTextContent('');
  }, []);

  // Duplicate warning handlers
  const handleAddAsAmendment = useCallback(async () => {
    if (!duplicateDocument || !pendingSource) return;

    setDuplicateDocument(null);
    setPendingSource(null);

    // Proceed with extraction - document will be saved as amendment
    handleExtract(true);
  }, [duplicateDocument, pendingSource, handleExtract]);

  const handleCancelDuplicate = useCallback(() => {
    setDuplicateDocument(null);
    setPendingSource(null);
  }, []);

  const handleReplaceDuplicate = useCallback(async () => {
    if (!duplicateDocument) return;

    try {
      // Delete the existing document
      await UnifiedDocumentService.deleteDocument(duplicateDocument.id);
    } catch (error) {
      console.error('[UnifiedDocumentInput] Failed to delete existing document:', error);
    }

    setDuplicateDocument(null);
    setPendingSource(null);

    // Proceed with extraction
    handleExtract(true);
  }, [duplicateDocument, handleExtract]);

  // Toggle section
  const handleToggle = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  const isProcessing = extractionStatus === 'fetching' || extractionStatus === 'extracting';

  return (
    <View style={styles.container}>
      {/* Header */}
      <Pressable
        style={styles.header}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Race documents section"
      >
        <View style={styles.headerLeft}>
          <Sparkles size={16} color={TUFTE_FORM_COLORS.aiAccent} />
          <Text style={styles.headerLabel}>RACE DOCUMENTS</Text>
          <Text style={styles.headerOptional}>(AI extraction)</Text>
          {extractionComplete && (
            <CheckCircle size={14} color={TUFTE_FORM_COLORS.success} style={styles.successIcon} />
          )}
        </View>
        {expanded ? (
          <ChevronDown size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        ) : (
          <ChevronRight size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        )}
      </Pressable>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.content}>
          {/* Input Method Tabs */}
          <InputMethodTabs
            activeMethod={activeMethod}
            onMethodChange={setActiveMethod}
            disabled={isProcessing}
          />

          {/* Document Type Selector (compact) */}
          <View style={styles.documentTypeRow}>
            <Text style={styles.fieldLabel}>Document type:</Text>
            <DocumentTypeSelector
              value={documentType}
              onChange={setDocumentType}
              disabled={isProcessing}
              compact
              showCommonOnly
            />
          </View>

          {/* Input Area */}
          {activeMethod === 'url' && (
            <URLInput
              value={urlValue}
              onChangeText={setUrlValue}
              disabled={isProcessing}
              onAutoDetect={handleUrlAutoDetect}
              onUrlsDetected={handleUrlsDetected}
              onTextContentDetected={handleTextContentDetected}
              onContentTypeChange={handleContentTypeChange}
            />
          )}

          {activeMethod === 'paste' && (
            <PasteInput
              value={pasteValue}
              onChangeText={setPasteValue}
              disabled={isProcessing}
              onUrlDetected={handleUrlDetected}
              minHeight={compact ? 80 : 120}
            />
          )}

          {activeMethod === 'upload' && (
            <PDFUpload
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              disabled={isProcessing}
              onAutoDetect={handleFileAutoDetect}
            />
          )}

          {/* Duplicate Warning */}
          {duplicateDocument && (
            <DuplicateWarning
              existingDocument={duplicateDocument}
              onAddAsAmendment={handleAddAsAmendment}
              onCancel={handleCancelDuplicate}
              onReplace={handleReplaceDuplicate}
            />
          )}

          {/* Extraction Progress */}
          {extractionStatus !== 'idle' && !duplicateDocument && (
            <ExtractionProgress
              status={extractionStatus}
              error={extractionError}
              extractedFieldCount={extractedFieldCount}
              documentType={documentType}
              batchProgress={batchProgress}
            />
          )}

          {/* Extract Button */}
          {extractionStatus === 'idle' && !duplicateDocument && (
            <Pressable
              style={[
                styles.extractButton,
                !canExtract() && styles.extractButtonDisabled,
              ]}
              onPress={() => handleExtract()}
              disabled={!canExtract()}
            >
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.extractButtonText}>
                {activeMethod === 'url' && detectedUrls.length > 1
                  ? `Extract from ${detectedUrls.length} URLs`
                  : activeMethod === 'url' && urlInputContentType === 'text'
                    ? 'Extract from Pasted Text'
                    : 'Extract Race Details'}
              </Text>
            </Pressable>
          )}

          {/* Try Again Button (on failure) */}
          {extractionStatus === 'failed' && (
            <View style={styles.actionButtons}>
              <Pressable style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>Try Again</Text>
              </Pressable>
            </View>
          )}

          {/* Hint */}
          <Text style={styles.hint}>
            AI will extract race name, date, location, VHF channels, and more from your document.
          </Text>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginBottom: TUFTE_FORM_SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: TUFTE_FORM_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1.2,
  },
  headerOptional: {
    fontSize: 11,
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  successIcon: {
    marginLeft: 4,
  },
  content: {
    paddingTop: TUFTE_FORM_SPACING.md,
    gap: TUFTE_FORM_SPACING.md,
  },
  documentTypeRow: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: TUFTE_FORM_COLORS.aiAccent,
    paddingVertical: 12,
    borderRadius: 8,
  },
  extractButtonDisabled: {
    opacity: 0.5,
  },
  extractButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  resetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: TUFTE_FORM_COLORS.inputBackgroundDisabled,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.label,
  },
  hint: {
    fontSize: 12,
    color: TUFTE_FORM_COLORS.secondaryLabel,
    textAlign: 'center',
  },
});

// Export sub-components for individual use
export { InputMethodTabs, URLInput, PasteInput, PDFUpload, DocumentTypeSelector, ExtractionProgress };
export type { InputMethod, SelectedFile, DocumentType, ExtractionStatus, BatchProgress, BatchUrlResult };

export default UnifiedDocumentInput;
