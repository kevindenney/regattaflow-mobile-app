// @ts-nocheck

/**
 * PDF Extraction Service
 * Universal PDF text extraction for web and native platforms
 * Supports multi-page PDFs with progress tracking
 *
 * Web implementation loads PDF.js from CDN to avoid bundling issues
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { createLogger } from '@/lib/utils/logger';

// PDF.js will be loaded from CDN on web
let pdfjsLib: any = null;

// Initialize PDF.js on web platform
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Load PDF.js from CDN
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  script.onload = () => {
    // @ts-ignore - PDF.js loaded globally
    pdfjsLib = window.pdfjsLib;
    if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    logger.debug('[PDFExtractionService] PDF.js loaded from CDN');
  };
  script.onerror = () => {
    console.error('[PDFExtractionService] Failed to load PDF.js from CDN');
  };
  document.head.appendChild(script);
}

interface PDFExtractionOptions {
  onProgress?: (progress: number, currentPage: number, totalPages: number) => void;
  maxPages?: number; // Limit extraction to first N pages
}

interface PDFExtractionResult {
  success: boolean;
  text?: string;
  pages?: number;
  error?: string;
}

const logger = createLogger('PDFExtractionService');
export class PDFExtractionService {
  /**
   * Extract text from PDF file
   * Automatically uses platform-specific extraction method
   */
  static async extractText(
    fileUri: string,
    options: PDFExtractionOptions = {}
  ): Promise<PDFExtractionResult> {
    try {
      if (Platform.OS === 'web') {
        return await this.extractTextWeb(fileUri, options);
      } else {
        return await this.extractTextNative(fileUri, options);
      }
    } catch (error: any) {
      console.error('PDF extraction error:', error);
      return {
        success: false,
        error: error.message || 'Failed to extract PDF text',
      };
    }
  }

  /**
   * Wait for PDF.js to load from CDN
   */
  private static async waitForPdfJs(maxWaitMs: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    while (!pdfjsLib && Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return !!pdfjsLib;
  }

  /**
   * Web PDF extraction using PDF.js from CDN
   */
  private static async extractTextWeb(
    fileUri: string,
    options: PDFExtractionOptions
  ): Promise<PDFExtractionResult> {
    try {
      // Wait for PDF.js to load if not already loaded
      if (!pdfjsLib) {
        logger.debug('[PDFExtractionService] Waiting for PDF.js to load from CDN...');
        const loaded = await this.waitForPdfJs();
        if (!loaded) {
          return {
            success: false,
            error: 'PDF.js library failed to load from CDN. Please check your internet connection and refresh the page.',
          };
        }
      }

      logger.debug('[PDFExtractionService] Loading PDF document from:', fileUri);

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument(fileUri);
      const pdf = await loadingTask.promise;

      logger.debug('[PDFExtractionService] PDF loaded successfully, pages:', pdf.numPages);

      const totalPages = Math.min(
        pdf.numPages,
        options.maxPages || pdf.numPages
      );

      let fullText = '';

      // Extract text from each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Concatenate text items
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n\n';

        // Report progress
        if (options.onProgress) {
          const progress = (pageNum / totalPages) * 100;
          options.onProgress(progress, pageNum, totalPages);
        }
      }

      return {
        success: true,
        text: fullText.trim(),
        pages: totalPages,
      };
    } catch (error: any) {
      console.error('Web PDF extraction error:', error);
      return {
        success: false,
        error: `Web PDF extraction failed: ${error.message}`,
      };
    }
  }

  /**
   * Native PDF extraction using react-native-pdf
   */
  private static async extractTextNative(
    fileUri: string,
    options: PDFExtractionOptions
  ): Promise<PDFExtractionResult> {
    try {
      // For native, we need to use a different approach
      // react-native-pdf doesn't support text extraction directly
      // We'll use expo-file-system to read the file and attempt basic extraction

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'PDF file not found',
        };
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // For now, we'll use a fallback approach
      // In production, you'd want to:
      // 1. Use a native PDF text extraction library
      // 2. Or send to a backend service for extraction
      // 3. Or use expo-document-picker's built-in preview capabilities

      // Report progress
      if (options.onProgress) {
        options.onProgress(100, 1, 1);
      }

      // Return a message indicating we need a better solution for native
      return {
        success: false,
        error: 'Native PDF text extraction requires additional setup. Please use the web version or upload a text file.',
      };
    } catch (error: any) {
      console.error('Native PDF extraction error:', error);
      return {
        success: false,
        error: `Native PDF extraction failed: ${error.message}`,
      };
    }
  }

  /**
   * Validate if file is a valid PDF
   */
  static async isValidPDF(fileUri: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Check if file starts with PDF signature
        const response = await fetch(fileUri);
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // PDF signature: %PDF-
        const signature = String.fromCharCode(...bytes.slice(0, 5));
        return signature === '%PDF-';
      } else {
        // For native, check file extension
        return fileUri.toLowerCase().endsWith('.pdf');
      }
    } catch (error) {
      console.error('PDF validation error:', error);
      return false;
    }
  }

  /**
   * Get PDF metadata
   */
  static async getMetadata(fileUri: string): Promise<{
    pages?: number;
    title?: string;
    author?: string;
    error?: string;
  }> {
    try {
      if (Platform.OS === 'web') {
        // Wait for PDF.js to load if not already loaded
        if (!pdfjsLib) {
          const loaded = await this.waitForPdfJs();
          if (!loaded) {
            return {
              error: 'PDF.js library not loaded',
            };
          }
        }

        const loadingTask = pdfjsLib.getDocument(fileUri);
        const pdf = await loadingTask.promise;
        const metadata = await pdf.getMetadata();

        return {
          pages: pdf.numPages,
          title: metadata.info?.Title,
          author: metadata.info?.Author,
        };
      } else {
        return {
          error: 'Metadata extraction not supported on native platforms',
        };
      }
    } catch (error: any) {
      return {
        error: error.message,
      };
    }
  }
}
