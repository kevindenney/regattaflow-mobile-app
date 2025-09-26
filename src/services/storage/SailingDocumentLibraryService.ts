/**
 * Sailing Document Library Service
 * Manages storage and processing of valuable sailing education documents
 * Including books, strategy guides, yacht club materials, etc.
 */

import { supabase } from '@/src/services/supabase';
import { DocumentProcessingService } from '../ai/DocumentProcessingService';
import { sailingEducationService } from '../ai/SailingEducationService';
import type { DocumentUpload, DocumentAnalysis } from '@/src/lib/types/ai-knowledge';

export interface SailingDocument {
  id: string;
  title: string;
  type: 'book' | 'strategy_guide' | 'yacht_club_material' | 'racing_rules' | 'technical_manual' | 'weather_guide';
  category: 'tides_currents' | 'tactics' | 'weather' | 'rules' | 'boat_handling' | 'navigation' | 'safety';
  source: 'user_upload' | 'yacht_club' | 'sailing_org' | 'expert_contribution';
  metadata: {
    author?: string;
    publication?: string;
    year?: number;
    venue?: string;
    language?: string;
    pages?: number;
    fileSize: number;
    uploadedBy: string;
    uploadedAt: Date;
  };
  content: {
    fullText?: string;
    summary: string;
    keyTopics: string[];
    extractedInsights: any[];
  };
  storage: {
    bucketName: string;
    filePath: string;
    publicUrl?: string;
    processedAt?: Date;
  };
  intelligence: {
    confidenceScore: number;
    applicableVenues: string[];
    conditions: string[];
    strategicValue: 'high' | 'medium' | 'low';
  };
  access: {
    visibility: 'private' | 'shared' | 'public';
    sharedWith?: string[]; // User IDs
    usageRights: 'personal' | 'educational' | 'commercial';
  };
}

export class SailingDocumentLibraryService {
  private documentProcessor: DocumentProcessingService;
  private readonly STORAGE_BUCKET = 'sailing-documents';

  constructor() {
    this.documentProcessor = new DocumentProcessingService();
    console.log('📚 SailingDocumentLibraryService initialized');
  }

  /**
   * Upload and process a valuable sailing document (like your tides/current strategy book)
   */
  async uploadSailingDocument(
    file: File | ArrayBuffer,
    metadata: {
      title: string;
      type: SailingDocument['type'];
      category: SailingDocument['category'];
      author?: string;
      venue?: string;
      description?: string;
    },
    userId: string
  ): Promise<SailingDocument> {
    console.log(`📖 Uploading sailing document: ${metadata.title}`);

    try {
      // Step 1: Upload to Supabase Storage
      const fileName = `${userId}/${Date.now()}_${metadata.title.replace(/\s+/g, '_')}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, file, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log(`✅ Document uploaded to storage: ${fileName}`);

      // Step 2: Process with AI for intelligence extraction
      const documentUpload: DocumentUpload = {
        filename: metadata.title,
        type: 'pdf',
        data: file instanceof File ? await file.arrayBuffer() : file,
        metadata: {
          venue: metadata.venue,
          raceType: this.getCategoryRaceType(metadata.category)
        }
      };

      const analysis = await this.documentProcessor.uploadDocument(documentUpload);
      console.log(`🧠 AI analysis complete: ${analysis.insights.length} insights extracted`);

      // Step 3: Extract specialized knowledge based on category
      const specializedInsights = await this.extractSpecializedKnowledge(
        analysis,
        metadata.category
      );

      // Step 4: Store document metadata in database
      const document: SailingDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: metadata.title,
        type: metadata.type,
        category: metadata.category,
        source: 'user_upload',
        metadata: {
          author: metadata.author,
          uploadedBy: userId,
          uploadedAt: new Date(),
          fileSize: file instanceof File ? file.size : file.byteLength
        },
        content: {
          summary: analysis.summary,
          keyTopics: analysis.keyTopics,
          extractedInsights: [
            ...analysis.insights,
            ...specializedInsights
          ]
        },
        storage: {
          bucketName: this.STORAGE_BUCKET,
          filePath: fileName,
          processedAt: new Date()
        },
        intelligence: {
          confidenceScore: analysis.confidence || 0.8,
          applicableVenues: this.determineApplicableVenues(metadata.category, analysis),
          conditions: analysis.conditions.map(c => c.description),
          strategicValue: this.assessStrategicValue(analysis, metadata.category)
        },
        access: {
          visibility: 'private',
          usageRights: 'educational'
        }
      };

      // Step 5: Save to database
      const { data: dbData, error: dbError } = await supabase
        .from('sailing_documents')
        .insert(document)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database save failed:', dbError);
        // Don't throw - document is still in storage
      }

      // Step 6: Process for sailing education framework
      if (metadata.category === 'tides_currents' || metadata.category === 'tactics') {
        await this.enhanceSailingEducation(document);
      }

      console.log(`🎉 Document successfully processed and stored: ${document.id}`);
      return document;

    } catch (error: any) {
      console.error('❌ Document upload failed:', error);
      throw new Error(`Failed to process sailing document: ${error.message}`);
    }
  }

  /**
   * Extract specialized knowledge based on document category
   * This is where your tides/current book would get special treatment
   */
  private async extractSpecializedKnowledge(
    analysis: DocumentAnalysis,
    category: SailingDocument['category']
  ): Promise<any[]> {
    const insights = [];

    switch (category) {
      case 'tides_currents':
        insights.push({
          type: 'tactical',
          title: 'Tidal Strategy Optimization',
          description: 'Document contains valuable tidal and current strategy information',
          strategicValue: 'high',
          applications: [
            'Current-driven tactical decisions',
            'Tidal gate timing optimization',
            'Layline adjustments for current',
            'Strategic course selection based on tidal flow'
          ],
          extractedConcepts: this.extractTidalConcepts(analysis)
        });
        break;

      case 'tactics':
        insights.push({
          type: 'strategic',
          title: 'Advanced Racing Tactics',
          description: 'Strategic racing concepts and decision-making frameworks',
          strategicValue: 'high',
          applications: [
            'Start line positioning',
            'Mark rounding optimization',
            'Fleet management strategies',
            'Risk/reward assessment'
          ]
        });
        break;

      case 'weather':
        insights.push({
          type: 'environmental',
          title: 'Weather Pattern Analysis',
          description: 'Weather interpretation and prediction strategies',
          strategicValue: 'high',
          applications: [
            'Local weather pattern recognition',
            'Forecasting for race planning',
            'Condition-based tactical decisions'
          ]
        });
        break;

      // Add more categories as needed
    }

    return insights;
  }

  /**
   * Extract tidal and current concepts from analysis
   */
  private extractTidalConcepts(analysis: DocumentAnalysis): string[] {
    const concepts = [];
    const content = analysis.summary.toLowerCase();

    // Look for key tidal/current concepts
    const tidalKeywords = [
      'ebb', 'flood', 'slack water', 'tidal gate', 'current line',
      'back eddy', 'tidal stream', 'lee bow', 'tide tables',
      'current vector', 'tidal relief', 'favorable current'
    ];

    for (const keyword of tidalKeywords) {
      if (content.includes(keyword)) {
        concepts.push(keyword);
      }
    }

    return concepts;
  }

  /**
   * Enhance the sailing education service with document insights
   */
  private async enhanceSailingEducation(document: SailingDocument): Promise<void> {
    console.log(`🎓 Enhancing sailing education with: ${document.title}`);

    const educationalContent = {
      tacticalSeminars: document.content.keyTopics.filter(t =>
        t.toLowerCase().includes('tactic') ||
        t.toLowerCase().includes('strategy')
      ),
      safetyTraining: document.content.keyTopics.filter(t =>
        t.toLowerCase().includes('safety')
      ),
      rulesEducation: document.content.keyTopics.filter(t =>
        t.toLowerCase().includes('rule') ||
        t.toLowerCase().includes('protest')
      )
    };

    await sailingEducationService.processYachtClubEducation(
      `User Library: ${document.title}`,
      educationalContent,
      document.intelligence.applicableVenues
    );
  }

  /**
   * Query the document library for relevant content
   */
  async searchDocumentLibrary(
    query: string,
    filters?: {
      category?: SailingDocument['category'];
      venue?: string;
      type?: SailingDocument['type'];
    },
    userId?: string
  ): Promise<SailingDocument[]> {
    console.log(`🔍 Searching document library: "${query}"`);

    let queryBuilder = supabase
      .from('sailing_documents')
      .select('*');

    // Apply filters
    if (filters?.category) {
      queryBuilder = queryBuilder.eq('category', filters.category);
    }
    if (filters?.venue) {
      queryBuilder = queryBuilder.contains('intelligence->applicableVenues', [filters.venue]);
    }
    if (filters?.type) {
      queryBuilder = queryBuilder.eq('type', filters.type);
    }

    // Access control
    if (userId) {
      queryBuilder = queryBuilder.or(`access->visibility.eq.public,metadata->uploadedBy.eq.${userId}`);
    } else {
      queryBuilder = queryBuilder.eq('access->visibility', 'public');
    }

    // Text search (if Supabase full-text search is enabled)
    if (query) {
      queryBuilder = queryBuilder.textSearch('content->summary', query);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('❌ Document search failed:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} documents`);
    return data || [];
  }

  /**
   * Get document recommendations based on user's sailing profile
   */
  async getRecommendedDocuments(
    userId: string,
    context?: {
      venue?: string;
      conditions?: string;
      skill?: 'novice' | 'intermediate' | 'expert';
    }
  ): Promise<SailingDocument[]> {
    console.log(`💡 Getting document recommendations for user: ${userId}`);

    // Start with user's upcoming venue
    let recommendations: SailingDocument[] = [];

    if (context?.venue) {
      // Get venue-specific documents
      const venueDocuments = await this.searchDocumentLibrary(
        '',
        { venue: context.venue },
        userId
      );
      recommendations.push(...venueDocuments);
    }

    // Add condition-specific documents (like your tides/current book)
    if (context?.conditions?.includes('tidal') || context?.conditions?.includes('current')) {
      const tidalDocuments = await this.searchDocumentLibrary(
        '',
        { category: 'tides_currents' },
        userId
      );
      recommendations.push(...tidalDocuments);
    }

    // Remove duplicates and sort by strategic value
    const uniqueDocuments = Array.from(
      new Map(recommendations.map(doc => [doc.id, doc])).values()
    );

    return uniqueDocuments.sort((a, b) => {
      const valueOrder = { high: 3, medium: 2, low: 1 };
      return valueOrder[b.intelligence.strategicValue] - valueOrder[a.intelligence.strategicValue];
    });
  }

  /**
   * Helper methods
   */
  private getCategoryRaceType(category: SailingDocument['category']): string {
    const categoryToRaceType: Record<string, string> = {
      'tides_currents': 'coastal_racing',
      'tactics': 'fleet_racing',
      'weather': 'offshore_racing',
      'rules': 'match_racing',
      'boat_handling': 'general',
      'navigation': 'offshore_racing',
      'safety': 'offshore_racing'
    };
    return categoryToRaceType[category] || 'general';
  }

  private determineApplicableVenues(
    category: SailingDocument['category'],
    analysis: DocumentAnalysis
  ): string[] {
    // If venue specified in analysis, use it
    if (analysis.venue) {
      return [analysis.venue];
    }

    // Otherwise, determine based on category
    switch (category) {
      case 'tides_currents':
        // Tidal strategy applies to venues with significant tides
        return [
          'san-francisco-bay',
          'solent-cowes',
          'hong-kong',
          'newport-rhode-island',
          'auckland'
        ];
      case 'weather':
        return ['all']; // Weather strategy is universal
      case 'tactics':
        return ['all']; // Tactical knowledge is universal
      default:
        return [];
    }
  }

  private assessStrategicValue(
    analysis: DocumentAnalysis,
    category: SailingDocument['category']
  ): 'high' | 'medium' | 'low' {
    // High-value categories
    if (['tides_currents', 'tactics', 'weather'].includes(category)) {
      return 'high';
    }

    // Based on insight count
    if (analysis.insights.length > 10) return 'high';
    if (analysis.insights.length > 5) return 'medium';
    return 'low';
  }

  /**
   * Get library statistics
   */
  async getLibraryStats(userId?: string): Promise<{
    totalDocuments: number;
    categoryCounts: Record<string, number>;
    totalInsights: number;
    storageUsed: number;
  }> {
    const { data, error } = await supabase
      .from('sailing_documents')
      .select('category, content, storage')
      .eq('metadata->uploadedBy', userId || '');

    if (error || !data) {
      return {
        totalDocuments: 0,
        categoryCounts: {},
        totalInsights: 0,
        storageUsed: 0
      };
    }

    const categoryCounts = data.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalInsights = data.reduce((sum, doc) =>
      sum + (doc.content?.extractedInsights?.length || 0), 0
    );

    const storageUsed = data.reduce((sum, doc) =>
      sum + (doc.storage?.fileSize || 0), 0
    );

    return {
      totalDocuments: data.length,
      categoryCounts,
      totalInsights,
      storageUsed
    };
  }
}

// Export singleton instance
export const sailingDocumentLibrary = new SailingDocumentLibraryService();