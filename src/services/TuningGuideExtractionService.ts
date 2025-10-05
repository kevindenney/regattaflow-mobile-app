/**
 * Tuning Guide Extraction Service
 * Handles OCR and content extraction from tuning guide PDFs and images using Google AI
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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
   */
  async extractFromPDF(pdfUrl: string, guideId: string): Promise<ExtractionResult> {
    try {
      // Update status to processing
      await this.updateExtractionStatus(guideId, 'processing');

      // Fetch PDF as blob
      const response = await fetch(pdfUrl);
      const blob = await response.blob();

      // Convert to base64 for Gemini API
      const base64Data = await this.blobToBase64(blob);

      // Use Gemini to extract content
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are an expert sailing coach analyzing a tuning guide. Extract and structure the content from this sailing tuning guide.

Please provide:
1. Full text content (all readable text)
2. Structured sections with:
   - Section title (e.g., "Light Wind", "Heavy Air", "Upwind Setup")
   - Content (detailed text for that section)
   - Conditions (wind speed, sea state, point of sail if mentioned)
   - Settings (specific rig/sail settings like shroud tension, backstay, outhaul, etc.)
3. Metadata (sailmaker, year, boat class if mentioned)

Return the data as JSON in this format:
{
  "fullText": "complete extracted text...",
  "sections": [
    {
      "title": "section name",
      "content": "section content",
      "conditions": {
        "windSpeed": "0-8 knots",
        "seaState": "flat",
        "points": "upwind"
      },
      "settings": {
        "upperShroud": "25",
        "lowerShroud": "20",
        "backstay": "loose",
        "outhaul": "2cm from black band"
      }
    }
  ],
  "metadata": {
    "sailmaker": "North Sails",
    "year": 2024,
    "boatClass": "Dragon"
  }
}`;

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: blob.type,
          },
        },
        prompt,
      ]);

      const responseText = result.response.text();

      // Parse JSON response
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
      const extractedData: ExtractionResult = jsonMatch
        ? JSON.parse(jsonMatch[1] || jsonMatch[0])
        : { fullText: responseText, sections: [] };

      // Store extracted content in database
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
  }

  /**
   * Extract content from an image tuning guide
   */
  async extractFromImage(imageUrl: string, guideId: string): Promise<ExtractionResult> {
    try {
      await this.updateExtractionStatus(guideId, 'processing');

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64Data = await this.blobToBase64(blob);

      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Extract all sailing tuning information from this image. This is a sailing tuning guide or rig chart.

Provide:
1. All visible text
2. Structured rig settings organized by wind conditions
3. Any diagrams or measurements described in text

Format as JSON:
{
  "fullText": "all text...",
  "sections": [
    {
      "title": "condition name",
      "content": "description",
      "conditions": {"windSpeed": "range"},
      "settings": {"setting": "value"}
    }
  ]
}`;

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: blob.type,
          },
        },
        prompt,
      ]);

      const responseText = result.response.text();
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
