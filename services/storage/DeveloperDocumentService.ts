/**
 * Developer Document Service
 * Bulk upload and management of training documents for AI system enhancement
 */

import { sailingDocumentLibrary, type SailingDocument } from './SailingDocumentLibraryService';
import { supabase } from '@/services/supabase';
import { DocumentProcessingService } from '../ai/DocumentProcessingService';
import type { DocumentUpload } from '@/lib/types/ai-knowledge';

export interface TrainingDocumentBatch {
  id: string;
  batchName: string;
  description: string;
  documentCount: number;
  processedCount: number;
  failedCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  documents: TrainingDocument[];
}

export interface TrainingDocument {
  id: string;
  filename: string;
  source: 'yacht_club' | 'sailing_org' | 'expert_contribution' | 'developer_upload';
  type: SailingDocument['type'];
  category: SailingDocument['category'];
  venue?: string;
  language?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  processed?: boolean;
}

export class DeveloperDocumentService {
  private documentProcessor: DocumentProcessingService;

  constructor() {
    this.documentProcessor = new DocumentProcessingService();
  }

  /**
   * Create a new training document batch
   */
  async createTrainingBatch(
    batchName: string,
    description: string,
    documents: Omit<TrainingDocument, 'id' | 'status'>[]
  ): Promise<TrainingDocumentBatch> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const batch: TrainingDocumentBatch = {
      id: batchId,
      batchName,
      description,
      documentCount: documents.length,
      processedCount: 0,
      failedCount: 0,
      status: 'pending',
      createdAt: new Date(),
      documents: documents.map((doc, index) => ({
        ...doc,
        id: `${batchId}_doc_${index}`,
        status: 'pending'
      }))
    };

    console.log(`📦 Created training batch: ${batchName} (${documents.length} documents)`);
    return batch;
  }

  /**
   * Bulk upload documents from local filesystem for training
   */
  async bulkUploadFromFilesystem(
    documentPaths: string[],
    metadata: {
      source: TrainingDocument['source'];
      venue?: string;
      language?: string;
      priority?: 'high' | 'medium' | 'low';
    }
  ): Promise<TrainingDocumentBatch> {
    const documents: Omit<TrainingDocument, 'id' | 'status'>[] = documentPaths.map(path => {
      const filename = path.split('/').pop() || path;

      // Auto-categorize based on filename patterns
      const { type, category } = this.categorizeFromFilename(filename);

      return {
        filename,
        source: metadata.source,
        type,
        category,
        venue: metadata.venue,
        language: metadata.language || 'en',
        priority: metadata.priority || 'medium',
        processed: false
      };
    });

    const batch = await this.createTrainingBatch(
      `Developer Upload ${new Date().toISOString().split('T')[0]}`,
      `Bulk upload of ${documentPaths.length} training documents`,
      documents
    );

    // Process each document
    await this.processBatch(batch);
    return batch;
  }

  /**
   * Upload yacht club educational resources for training
   */
  async uploadYachtClubResources(
    yachtClubName: string,
    resources: {
      url?: string;
      filePath?: string;
      title: string;
      description?: string;
      venue?: string;
      type: SailingDocument['type'];
      category: SailingDocument['category'];
    }[]
  ): Promise<TrainingDocumentBatch> {
    const documents: Omit<TrainingDocument, 'id' | 'status'>[] = resources.map(resource => ({
      filename: resource.title,
      source: 'yacht_club',
      type: resource.type,
      category: resource.category,
      venue: resource.venue,
      language: 'en',
      priority: 'high', // Yacht club resources are high priority
      processed: false
    }));

    const batch = await this.createTrainingBatch(
      `${yachtClubName} Educational Resources`,
      `Training documents from ${yachtClubName}`,
      documents
    );

    console.log(`🏆 Created yacht club training batch for ${yachtClubName}`);
    return batch;
  }

  /**
   * Process a training batch
   */
  async processBatch(batch: TrainingDocumentBatch): Promise<void> {
    console.log(`🔄 Processing training batch: ${batch.batchName}`);
    batch.status = 'processing';

    for (const doc of batch.documents) {
      try {
        doc.status = 'processing';

        // In a real implementation, you'd process the actual files
        // For now, we'll simulate the processing
        await this.processTrainingDocument(doc, batch.id);

        doc.status = 'completed';
        doc.processed = true;
        batch.processedCount++;

        console.log(`✅ Processed training document: ${doc.filename}`);

      } catch (error: any) {
        console.error(`❌ Failed to process ${doc.filename}:`, error);
        doc.status = 'failed';
        doc.error = error.message;
        batch.failedCount++;
      }
    }

    batch.status = batch.failedCount === 0 ? 'completed' : 'failed';
    batch.completedAt = new Date();

    console.log(`🏁 Batch processing complete: ${batch.processedCount}/${batch.documentCount} successful`);
  }

  /**
   * Process individual training document
   */
  private async processTrainingDocument(doc: TrainingDocument, batchId: string): Promise<void> {
    // Create a mock sailing document for training
    const mockDocument: SailingDocument = {
      id: doc.id,
      title: doc.filename,
      type: doc.type,
      category: doc.category,
      source: doc.source,
      metadata: {
        uploadedBy: 'developer',
        uploadedAt: new Date(),
        fileSize: 1024 * 50, // Mock size
        language: doc.language
      },
      content: {
        summary: `Training document: ${doc.filename}`,
        keyTopics: this.generateMockTopics(doc.category),
        extractedInsights: this.generateMockInsights(doc.category)
      },
      storage: {
        bucketName: 'sailing-documents',
        filePath: `training/${batchId}/${doc.filename}`,
        processedAt: new Date()
      },
      intelligence: {
        confidenceScore: 0.85,
        applicableVenues: doc.venue ? [doc.venue] : ['all'],
        conditions: this.generateConditions(doc.category),
        strategicValue: doc.priority === 'high' ? 'high' : 'medium'
      },
      access: {
        visibility: 'private', // Training docs are private
        usageRights: 'educational'
      }
    };

    // Save to database (in development mode, this might be optional)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 [DEV MODE] Would save training document: ${doc.filename}`);
    } else {
      await this.saveTrainingDocument(mockDocument);
    }
  }

  /**
   * Save training document to database
   */
  private async saveTrainingDocument(document: SailingDocument): Promise<void> {
    const { error } = await supabase
      .from('sailing_documents')
      .insert(document);

    if (error) {
      throw new Error(`Failed to save training document: ${error.message}`);
    }
  }

  /**
   * Auto-categorize document from filename
   */
  private categorizeFromFilename(filename: string): {
    type: SailingDocument['type'];
    category: SailingDocument['category'];
  } {
    const lower = filename.toLowerCase();

    // Tides and currents
    if (lower.includes('tide') || lower.includes('current') || lower.includes('tidal')) {
      return { type: 'book', category: 'tides_currents' };
    }

    // Racing rules
    if (lower.includes('rule') || lower.includes('protest') || lower.includes('rrob')) {
      return { type: 'racing_rules', category: 'rules' };
    }

    // Weather
    if (lower.includes('weather') || lower.includes('wind') || lower.includes('forecast')) {
      return { type: 'weather_guide', category: 'weather' };
    }

    // Safety
    if (lower.includes('safety') || lower.includes('rescue') || lower.includes('emergency')) {
      return { type: 'technical_manual', category: 'safety' };
    }

    // Sailing instructions
    if (lower.includes('sailing_instruction') || lower.includes('si') || lower.includes('notice')) {
      return { type: 'strategy_guide', category: 'tactics' };
    }

    // Navigation
    if (lower.includes('navigation') || lower.includes('chart') || lower.includes('position')) {
      return { type: 'technical_manual', category: 'navigation' };
    }

    // Default to tactics
    return { type: 'strategy_guide', category: 'tactics' };
  }

  /**
   * Generate mock topics for training
   */
  private generateMockTopics(category: SailingDocument['category']): string[] {
    const topicMap: Record<string, string[]> = {
      'tides_currents': ['Tidal Strategy', 'Current Analysis', 'Tidal Gates', 'Lee Bow Effect'],
      'tactics': ['Start Line Strategy', 'Mark Rounding', 'Fleet Management', 'Tactical Decisions'],
      'weather': ['Wind Patterns', 'Weather Routing', 'Local Effects', 'Forecasting'],
      'rules': ['Racing Rules', 'Protests', 'Right of Way', 'Penalties'],
      'boat_handling': ['Sail Trim', 'Boat Speed', 'Maneuvering', 'Equipment'],
      'navigation': ['Chart Reading', 'GPS Usage', 'Waypoints', 'Course Planning'],
      'safety': ['Safety Equipment', 'Emergency Procedures', 'Risk Assessment', 'Communication']
    };

    return topicMap[category] || ['General Sailing Knowledge'];
  }

  /**
   * Generate mock insights for training
   */
  private generateMockInsights(category: SailingDocument['category']): any[] {
    return [
      {
        type: 'strategic',
        title: `${category.replace('_', ' ')} Training Insight`,
        description: `Professional training insight for ${category} development`,
        confidence: 0.85,
        strategicValue: 'high'
      }
    ];
  }

  /**
   * Generate conditions based on category
   */
  private generateConditions(category: SailingDocument['category']): string[] {
    const conditionMap: Record<string, string[]> = {
      'tides_currents': ['Tidal flow', 'Current vectors', 'Slack water'],
      'tactics': ['Fleet racing', 'Mark rounding', 'Start line positioning'],
      'weather': ['Wind shifts', 'Weather patterns', 'Local effects'],
      'rules': ['Racing rules', 'Protest situations', 'Right of way'],
      'boat_handling': ['Sail trim', 'Boat handling', 'Equipment setup'],
      'navigation': ['Chart navigation', 'Course planning', 'Position fixing'],
      'safety': ['Safety protocols', 'Emergency procedures', 'Risk management']
    };

    return conditionMap[category] || ['General sailing conditions'];
  }

  /**
   * Get training statistics
   */
  async getTrainingStats(): Promise<{
    totalBatches: number;
    totalDocuments: number;
    processedDocuments: number;
    failedDocuments: number;
    categoryCounts: Record<string, number>;
    sourceCounts: Record<string, number>;
  }> {
    // In a real implementation, query the database
    return {
      totalBatches: 0,
      totalDocuments: 0,
      processedDocuments: 0,
      failedDocuments: 0,
      categoryCounts: {},
      sourceCounts: {}
    };
  }
}

// Export singleton instance
export const developerDocumentService = new DeveloperDocumentService();

/**
 * Developer utility functions for common training scenarios
 */
export const DeveloperTrainingUtils = {
  /**
   * Quick upload for RHKYC-style yacht club documents
   */
  async uploadYachtClubBundle(yachtClubName: string, venue: string) {
    const resources = [
      {
        title: 'Offshore Racing Safety Preparation',
        type: 'technical_manual' as const,
        category: 'safety' as const,
        venue
      },
      {
        title: 'Local Knowledge and Harbour Secrets',
        type: 'strategy_guide' as const,
        category: 'tactics' as const,
        venue
      },
      {
        title: 'Weather Routing and Analysis',
        type: 'weather_guide' as const,
        category: 'weather' as const,
        venue
      },
      {
        title: 'Racing Rules Workshop',
        type: 'racing_rules' as const,
        category: 'rules' as const,
        venue
      }
    ];

    return await developerDocumentService.uploadYachtClubResources(
      yachtClubName,
      resources
    );
  },

  /**
   * Upload tides and currents training documents
   */
  async uploadTidesCurrentsBundle(venue?: string) {
    const resources = [
      {
        title: 'Tides and Current Strategy Guide',
        type: 'book' as const,
        category: 'tides_currents' as const,
        venue
      },
      {
        title: 'Tidal Gate Timing Optimization',
        type: 'strategy_guide' as const,
        category: 'tides_currents' as const,
        venue
      },
      {
        title: 'Current Vector Analysis',
        type: 'technical_manual' as const,
        category: 'tides_currents' as const,
        venue
      }
    ];

    return await developerDocumentService.uploadYachtClubResources(
      'Tides & Currents Training',
      resources
    );
  }
};