/**
 * Tuning Guide Extraction Service
 * Handles OCR and content extraction from tuning guide PDFs and images using Anthropic Claude
 *
 * NOTE: OCR extraction temporarily disabled for web compatibility
 * - Anthropic SDK requires Node.js environment
 * - Search and read operations still work with already-extracted content
 * TODO: Move extraction to backend API endpoint for web support
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

// NOTE: Anthropic SDK disabled for web compatibility
// const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
// if (!ANTHROPIC_API_KEY) {
//   throw new Error('Anthropic API key not found. Set EXPO_PUBLIC_ANTHROPIC_API_KEY environment variable.');
// }

// const genAI = new Anthropic({
//   apiKey: ANTHROPIC_API_KEY,
//   dangerouslyAllowBrowser: true // Development only - move to backend for production
// });

export interface ExtractedSection {
  title: string;
  content: string;
  conditions?: {
    windSpeed?: string;
    seaState?: string;
    points?: string; // upwind, downwind, reaching
  };
  settings?: {
    [key: string]: string | number;
  };
}

export interface ExtractionResult {
  fullText: string;
  sections: ExtractedSection[];
  metadata?: {
    sailmaker?: string;
    year?: number;
    boatClass?: string;
  };
}

class TuningGuideExtractionService {
  /**
   * Extract content from a PDF tuning guide
   * NOTE: Disabled for web - requires backend API
   */
  async extractFromPDF(pdfUrl: string, guideId: string): Promise<ExtractionResult> {
    throw new Error(
      'PDF extraction is not available on web. ' +
      'This feature requires the Anthropic SDK which only works in Node.js environments. ' +
      'Please implement a backend API endpoint for extraction.'
    );

    // Original implementation commented out for web compatibility
    /*
    try {
      // Update status to processing
      await this.updateExtractionStatus(guideId, 'processing');

      // Fetch PDF as blob
      const response = await fetch(pdfUrl);
      const blob = await response.blob();

      // Convert to base64 for Claude API
      const base64Data = await this.blobToBase64(blob);

      // Use Claude to extract content
      const prompt = `...`;

      const message = await genAI.messages.create({
        model: 'claude-3-haiku-20240307', // Using cheapest model for extraction (3x savings)
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: blob.type,
                data: base64Data
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
      const extractedData: ExtractionResult = jsonMatch
        ? JSON.parse(jsonMatch[1] || jsonMatch[0])
        : { fullText: responseText, sections: [] };

      await this.storeExtractedContent(guideId, extractedData);
      return extractedData;
    } catch (error) {
      console.error('Error extracting from PDF:', error);
      await this.updateExtractionStatus(
        guideId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
    */
  }

  /**
   * Extract content from an image tuning guide
   * NOTE: Disabled for web - requires backend API
   */
  async extractFromImage(imageUrl: string, guideId: string): Promise<ExtractionResult> {
    throw new Error(
      'Image extraction is not available on web. ' +
      'This feature requires the Anthropic SDK which only works in Node.js environments. ' +
      'Please implement a backend API endpoint for extraction.'
    );

    // Original implementation commented out for web compatibility
    /*
    try {
      await this.updateExtractionStatus(guideId, 'processing');

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64Data = await this.blobToBase64(blob);

      const prompt = `...`;

      const message = await genAI.messages.create({
        model: 'claude-3-haiku-20240307', // Using cheapest model for extraction (3x savings)
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: blob.type,
                data: base64Data
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
      const extractedData: ExtractionResult = jsonMatch
        ? JSON.parse(jsonMatch[1] || jsonMatch[0])
        : { fullText: responseText, sections: [] };

      await this.storeExtractedContent(guideId, extractedData);
      return extractedData;
    } catch (error) {
      console.error('Error extracting from image:', error);
      await this.updateExtractionStatus(
        guideId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
    */
  }

  /**
   * Extract content from any guide type
   */
  async extractContent(guideId: string, fileUrl: string, fileType: string): Promise<ExtractionResult> {
    if (fileType === 'pdf') {
      return this.extractFromPDF(fileUrl, guideId);
    } else if (fileType === 'image') {
      return this.extractFromImage(fileUrl, guideId);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Search extracted content
   */
  async searchExtractedContent(
    query: string,
    classId?: string,
    sailorId?: string
  ): Promise<any[]> {
    const { data, error } = await supabase.rpc('search_tuning_guides', {
      search_query: query,
      p_class_id: classId,
      p_sailor_id: sailorId,
    });

    if (error) {
      console.error('Error searching guides:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get extraction status for a guide
   */
  async getExtractionStatus(guideId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    extractedAt?: string;
  }> {
    const { data, error } = await supabase
      .from('tuning_guides')
      .select('extraction_status, extraction_error, extracted_at')
      .eq('id', guideId)
      .single();

    if (error) {
      throw error;
    }

    return {
      status: data.extraction_status,
      error: data.extraction_error,
      extractedAt: data.extracted_at,
    };
  }

  // Helper methods
  private async storeExtractedContent(
    guideId: string,
    extractedData: ExtractionResult
  ): Promise<void> {
    const { error } = await supabase
      .from('tuning_guides')
      .update({
        extracted_content: extractedData.fullText,
        extracted_sections: extractedData.sections,
        extraction_status: 'completed',
        extracted_at: new Date().toISOString(),
      })
      .eq('id', guideId);

    if (error) {
      throw error;
    }
  }

  private async updateExtractionStatus(
    guideId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('tuning_guides')
      .update({
        extraction_status: status,
        extraction_error: errorMessage,
      })
      .eq('id', guideId);

    if (error) {
      console.error('Error updating extraction status:', error);
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const tuningGuideExtractionService = new TuningGuideExtractionService();
