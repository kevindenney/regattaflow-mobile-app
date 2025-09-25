/**
 * AI Document Processing Service - Sailing Strategy Knowledge Base
 * Processes PDFs, sailing instructions, and strategy documents for Gemini AI training
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  DocumentUpload,
  DocumentAnalysis,
  StrategyInsight,
  RacingDocument,
  DocumentMetadata
} from '@/src/lib/types/ai-knowledge';

export class DocumentProcessingService {
  private gemini: GoogleGenerativeAI;
  private knowledgeBase: Map<string, ProcessedDocument> = new Map();

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('Google AI API key not found. Some features will be limited.');
      // Initialize without API key for development
      this.gemini = new GoogleGenerativeAI('dummy-key');
    } else {
      this.gemini = new GoogleGenerativeAI(apiKey);
    }
    console.log('📚 DocumentProcessingService initialized with Google AI Gemini');
  }

  /**
   * Upload and process a sailing strategy document
   */
  async uploadDocument(upload: DocumentUpload): Promise<DocumentAnalysis> {
    console.log('📄 Processing document:', upload.filename);

    try {
      // Extract text from PDF/document
      const extractedText = await this.extractTextFromDocument(upload);

      // Analyze document with Gemini AI
      const analysis = await this.analyzeDocumentContent(extractedText, upload);

      // Store in knowledge base
      const processedDoc: ProcessedDocument = {
        id: this.generateDocumentId(),
        metadata: {
          filename: upload.filename,
          type: upload.type,
          uploadedAt: new Date(),
          fileSize: upload.data.length,
          documentClass: analysis.documentClass
        },
        content: extractedText,
        analysis: analysis,
        embeddings: await this.generateEmbeddings(extractedText)
      };

      this.knowledgeBase.set(processedDoc.id, processedDoc);

      console.log('✅ Document processed and added to knowledge base:', {
        id: processedDoc.id,
        class: analysis.documentClass,
        insights: analysis.insights.length
      });

      return analysis;

    } catch (error: any) {
      console.error('❌ Failed to process document:', error);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Query the knowledge base for sailing strategy insights
   */
  async queryKnowledgeBase(query: string, context?: {
    venue?: string;
    conditions?: string;
    raceType?: string;
  }): Promise<StrategyInsight[]> {
    console.log('🔍 Querying knowledge base:', query);

    try {
      // Generate query embeddings
      const queryEmbeddings = await this.generateEmbeddings(query);

      // Find relevant documents using semantic similarity
      const relevantDocs = await this.findRelevantDocuments(queryEmbeddings, context);

      // Generate insights using Gemini AI
      const insights = await this.generateInsights(query, relevantDocs, context);

      console.log('✅ Generated insights:', insights.length);
      return insights;

    } catch (error: any) {
      console.error('❌ Knowledge base query failed:', error);
      throw new Error(`Knowledge base query failed: ${error.message}`);
    }
  }

  /**
   * Get document analysis for race strategy
   */
  async analyzeRaceStrategy(
    racingDocuments: RacingDocument[],
    conditions: {
      wind: { speed: number; direction: number };
      current: { speed: number; direction: number };
      venue: string;
    }
  ): Promise<StrategyInsight[]> {
    console.log('🎯 Analyzing race strategy');

    try {
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });

      const prompt = this.buildRaceAnalysisPrompt(racingDocuments, conditions);

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Parse structured response
      const insights = this.parseStrategyResponse(response);

      return insights;

    } catch (error: any) {
      console.error('❌ Race strategy analysis failed:', error);
      throw new Error(`Race strategy analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract text from document (PDF/image OCR)
   */
  private async extractTextFromDocument(upload: DocumentUpload): Promise<string> {
    if (upload.type === 'pdf') {
      // Use PDF.js or similar for text extraction
      return await this.extractPDFText(upload.data);
    } else if (upload.type === 'image') {
      // Use OCR for image documents
      return await this.performOCR(upload.data);
    } else {
      throw new Error(`Unsupported document type: ${upload.type}`);
    }
  }

  /**
   * Analyze document content with Gemini AI
   */
  private async analyzeDocumentContent(
    text: string,
    upload: DocumentUpload
  ): Promise<DocumentAnalysis> {
    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
Analyze this sailing strategy document and provide structured analysis:

Document Type: ${upload.type}
Filename: ${upload.filename}

Content:
${text}

Please analyze and return JSON with:
1. documentClass: "sailing_instructions", "race_strategy", "tactics_guide", "rules", "venue_guide", or "other"
2. keyTopics: Array of main topics covered
3. insights: Array of strategic insights found
4. tacticalAdvice: Specific tactical recommendations
5. conditions: Weather/environmental conditions mentioned
6. venue: Racing venue if identified
7. summary: Brief summary of the document

Format as valid JSON.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Parse JSON response
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '');
      const analysis = JSON.parse(cleanedResponse) as DocumentAnalysis;

      return analysis;

    } catch (error) {
      console.error('Failed to parse AI analysis:', error);

      // Fallback analysis
      return {
        documentClass: 'other',
        keyTopics: ['sailing', 'strategy'],
        insights: [{
          type: 'general',
          title: 'Document Processed',
          description: 'Document has been added to knowledge base',
          confidence: 0.5,
          tacticalAdvice: 'Review document content for strategic insights',
          applicableConditions: []
        }],
        tacticalAdvice: 'Document analysis pending manual review',
        conditions: [],
        venue: null,
        summary: `Processed ${upload.filename} - content available for queries`
      };
    }
  }

  /**
   * Generate embeddings for semantic search
   */
  private async generateEmbeddings(text: string): Promise<number[]> {
    // For now, return mock embeddings
    // In production, use proper embedding model
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);

    // Simple word-based embedding simulation
    words.forEach((word, index) => {
      if (index < embedding.length) {
        embedding[index] = word.length / 10;
      }
    });

    return embedding;
  }

  /**
   * Find documents relevant to query using semantic similarity
   */
  private async findRelevantDocuments(
    queryEmbeddings: number[],
    context?: any
  ): Promise<ProcessedDocument[]> {
    const relevantDocs: ProcessedDocument[] = [];
    const threshold = 0.7; // Similarity threshold

    for (const [id, doc] of this.knowledgeBase) {
      const similarity = this.calculateCosineSimilarity(queryEmbeddings, doc.embeddings);

      if (similarity > threshold) {
        relevantDocs.push(doc);
      }
    }

    // Sort by relevance
    return relevantDocs.sort((a, b) => {
      const simA = this.calculateCosineSimilarity(queryEmbeddings, a.embeddings);
      const simB = this.calculateCosineSimilarity(queryEmbeddings, b.embeddings);
      return simB - simA;
    }).slice(0, 5); // Top 5 most relevant
  }

  /**
   * Generate strategy insights using relevant documents
   */
  private async generateInsights(
    query: string,
    relevantDocs: ProcessedDocument[],
    context?: any
  ): Promise<StrategyInsight[]> {
    if (relevantDocs.length === 0) {
      return [{
        type: 'general',
        title: 'No Relevant Documents',
        description: 'No documents found matching your query. Consider uploading sailing strategy documents.',
        confidence: 0.1,
        tacticalAdvice: 'Upload sailing instructions or strategy guides to get AI insights',
        applicableConditions: []
      }];
    }

    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const contextStr = context ? `
Context:
- Venue: ${context.venue || 'Unknown'}
- Conditions: ${context.conditions || 'Not specified'}
- Race Type: ${context.raceType || 'Not specified'}
    ` : '';

    const docsContext = relevantDocs.map(doc =>
      `Document: ${doc.metadata.filename}\nContent: ${doc.content.substring(0, 1000)}...`
    ).join('\n\n');

    const prompt = `
Based on the following sailing strategy documents, answer this query: "${query}"

${contextStr}

Relevant Documents:
${docsContext}

Provide strategic insights in JSON format with array of insights, each having:
- type: "tactical", "strategic", "rules", "conditions", or "general"
- title: Brief title
- description: Detailed explanation
- confidence: 0-1 confidence score
- tacticalAdvice: Specific actionable advice
- applicableConditions: Array of conditions where this applies

Format as valid JSON array.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '');
      const insights = JSON.parse(cleanedResponse) as StrategyInsight[];

      return insights;

    } catch (error) {
      console.error('Failed to generate insights:', error);
      return [{
        type: 'general',
        title: 'Analysis Available',
        description: `Found ${relevantDocs.length} relevant documents for your query.`,
        confidence: 0.8,
        tacticalAdvice: 'Review the uploaded documents for detailed strategic guidance',
        applicableConditions: []
      }];
    }
  }

  /**
   * Build race analysis prompt
   */
  private buildRaceAnalysisPrompt(
    documents: RacingDocument[],
    conditions: any
  ): string {
    const docsText = documents.map(doc =>
      `${doc.type.toUpperCase()}: ${doc.content}`
    ).join('\n\n');

    return `
Analyze this sailing race scenario and provide strategic recommendations:

CONDITIONS:
- Wind: ${conditions.wind.speed} knots at ${conditions.wind.direction}°
- Current: ${conditions.current.speed} knots at ${conditions.current.direction}°
- Venue: ${conditions.venue}

RACE DOCUMENTS:
${docsText}

Provide comprehensive race strategy analysis including:
1. Start line strategy
2. First beat tactics
3. Mark rounding approach
4. Downwind strategy
5. Key decision points
6. Risk assessment
7. Tactical alternatives

Format as structured tactical advice with confidence scores.
    `;
  }

  /**
   * Parse strategy response from AI
   */
  private parseStrategyResponse(response: string): StrategyInsight[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback to text parsing
      return [{
        type: 'strategic',
        title: 'Race Strategy Analysis',
        description: response,
        confidence: 0.8,
        tacticalAdvice: 'Review the complete analysis for detailed recommendations',
        applicableConditions: ['all']
      }];

    } catch (error) {
      console.error('Failed to parse strategy response:', error);
      return [{
        type: 'general',
        title: 'Strategy Analysis Available',
        description: 'Race analysis completed - review for tactical recommendations',
        confidence: 0.7,
        tacticalAdvice: response.substring(0, 200) + '...',
        applicableConditions: []
      }];
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractPDFText(data: ArrayBuffer): Promise<string> {
    // Mock implementation - in production use pdf.js
    return "PDF text extraction would be implemented here using pdf.js or similar library";
  }

  /**
   * Perform OCR on image
   */
  private async performOCR(data: ArrayBuffer): Promise<string> {
    // Mock implementation - in production use Tesseract.js or cloud OCR
    return "OCR text extraction would be implemented here";
  }

  /**
   * Calculate cosine similarity between embeddings
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Generate unique document ID
   */
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get knowledge base statistics
   */
  getKnowledgeBaseStats() {
    const docs = Array.from(this.knowledgeBase.values());
    const docsByClass = docs.reduce((acc, doc) => {
      const cls = doc.analysis.documentClass;
      acc[cls] = (acc[cls] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalDocuments: docs.length,
      documentClasses: docsByClass,
      totalSize: docs.reduce((sum, doc) => sum + doc.metadata.fileSize, 0),
      lastUpdated: docs.length > 0 ? Math.max(...docs.map(d => d.metadata.uploadedAt.getTime())) : null
    };
  }
}

// Types for document processing
interface ProcessedDocument {
  id: string;
  metadata: DocumentMetadata;
  content: string;
  analysis: DocumentAnalysis;
  embeddings: number[];
}

export default DocumentProcessingService;