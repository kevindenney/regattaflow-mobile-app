/**
 * AI Knowledge Base Types
 * Types for document processing and sailing strategy AI analysis
 */

// Document upload interface
export interface DocumentUpload {
  filename: string;
  type: 'pdf' | 'image' | 'text';
  data: ArrayBuffer;
  metadata?: {
    venue?: string;
    raceType?: string;
    uploadedBy?: string;
  };
}

// Document metadata
export interface DocumentMetadata {
  filename: string;
  type: string;
  uploadedAt: Date;
  fileSize: number;
  documentClass: DocumentClass;
  venue?: string;
  raceType?: string;
  language?: string;
}

// Document classification
export type DocumentClass =
  | 'sailing_instructions'
  | 'race_strategy'
  | 'tactics_guide'
  | 'rules'
  | 'venue_guide'
  | 'weather_guide'
  | 'technical_manual'
  | 'other';

// Document analysis result
export interface DocumentAnalysis {
  documentClass: DocumentClass;
  keyTopics: string[];
  insights: StrategyInsight[];
  tacticalAdvice: string;
  conditions: WeatherCondition[];
  venue: string | null;
  summary: string;
  confidence?: number;
}

// Strategy insight from AI analysis
export interface StrategyInsight {
  type: 'tactical' | 'strategic' | 'rules' | 'conditions' | 'general';
  title: string;
  description: string;
  confidence: number; // 0-1
  tacticalAdvice: string;
  applicableConditions: string[];
  priority?: 'high' | 'medium' | 'low';
  source?: string; // Document filename
}

// Racing document types
export interface RacingDocument {
  id: string;
  type: 'sailing_instructions' | 'notice_of_race' | 'course_diagram' | 'other';
  content: string;
  metadata: DocumentMetadata;
}

// Weather conditions mentioned in documents
export interface WeatherCondition {
  type: 'wind' | 'current' | 'tide' | 'waves' | 'visibility';
  description: string;
  range?: {
    min: number;
    max: number;
    unit: string;
  };
}

// AI chat message for strategy discussions
export interface StrategyChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    race?: string;
    venue?: string;
    conditions?: any;
  };
  insights?: StrategyInsight[];
}

// AI knowledge base query
export interface KnowledgeQuery {
  query: string;
  context?: {
    venue?: string;
    conditions?: string;
    raceType?: string;
    documentTypes?: DocumentClass[];
  };
  maxResults?: number;
}

// AI analysis request
export interface AnalysisRequest {
  type: 'race_strategy' | 'document_analysis' | 'tactical_advice' | 'rule_clarification';
  context: {
    venue: string;
    conditions: {
      wind: { speed: number; direction: number };
      current?: { speed: number; direction: number };
      tide?: { height: number; direction: 'flood' | 'ebb' };
    };
    race?: {
      course: string;
      startTime: Date;
      fleet: string;
    };
  };
  documents?: string[]; // Document IDs to reference
  specificQuestions?: string[];
}

// AI analysis response
export interface AnalysisResponse {
  requestId: string;
  insights: StrategyInsight[];
  recommendations: TacticalRecommendation[];
  confidence: number;
  sources: string[]; // Referenced documents
  generatedAt: Date;
}

// Tactical recommendation
export interface TacticalRecommendation {
  phase: 'pre_start' | 'start' | 'first_beat' | 'mark_rounding' | 'downwind' | 'finish';
  priority: 'critical' | 'important' | 'consider';
  action: string;
  rationale: string;
  conditions: string[];
  riskLevel: 'low' | 'medium' | 'high';
  alternatives?: string[];
}

// AI training data structure
export interface TrainingData {
  documents: ProcessedDocument[];
  racingScenarios: RacingScenario[];
  tacticalPatterns: TacticalPattern[];
  performanceMetrics: AIPerformanceMetrics;
}

// Processed document for AI training
export interface ProcessedDocument {
  id: string;
  metadata: DocumentMetadata;
  content: string;
  embeddings: number[];
  keyPhrases: string[];
  entities: DocumentEntity[];
  relationships: DocumentRelationship[];
}

// Document entity extraction
export interface DocumentEntity {
  type: 'venue' | 'rule' | 'tactic' | 'condition' | 'equipment';
  text: string;
  confidence: number;
  position: { start: number; end: number };
}

// Document relationship mapping
export interface DocumentRelationship {
  type: 'references' | 'contradicts' | 'supports' | 'clarifies';
  source: string;
  target: string;
  confidence: number;
}

// Racing scenario for AI training
export interface RacingScenario {
  id: string;
  venue: string;
  conditions: {
    wind: { speed: number; direction: number; variability: number };
    current: { speed: number; direction: number };
    waves: { height: number; period: number };
  };
  course: {
    type: string;
    marks: Array<{ name: string; position: [number, number] }>;
    distances: { [leg: string]: number };
  };
  strategy: {
    recommended: TacticalRecommendation[];
    alternatives: TacticalRecommendation[];
    riskAssessment: string;
  };
  outcome?: {
    performance: 'excellent' | 'good' | 'poor';
    lessons: string[];
  };
}

// Tactical pattern recognition
export interface TacticalPattern {
  name: string;
  conditions: string[];
  frequency: number; // How often this pattern appears
  success_rate: number; // 0-1
  description: string;
  examples: string[];
  related_rules: string[];
}

// AI performance metrics
export interface AIPerformanceMetrics {
  accuracy: {
    documentClassification: number;
    strategicAdvice: number;
    ruleInterpretation: number;
  };
  responseTime: {
    average: number; // milliseconds
    p95: number;
    p99: number;
  };
  userSatisfaction: {
    averageRating: number; // 1-5
    totalRatings: number;
    feedback: string[];
  };
  knowledgeBase: {
    documentsProcessed: number;
    totalTokens: number;
    lastUpdated: Date;
  };
}

// AI chat session
export interface StrategyChatSession {
  id: string;
  userId: string;
  title: string;
  messages: StrategyChatMessage[];
  context: {
    race?: string;
    venue?: string;
    activeDocuments?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Document similarity search result
export interface SimilaritySearchResult {
  documentId: string;
  similarity: number;
  relevantSections: Array<{
    text: string;
    confidence: number;
  }>;
}

// AI model configuration
export interface AIModelConfig {
  model: string; // 'gemini-1.5-pro', etc.
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  contextWindow: number;
}

// Knowledge base statistics
export interface KnowledgeBaseStats {
  totalDocuments: number;
  documentClasses: Record<DocumentClass, number>;
  totalSize: number; // bytes
  lastUpdated: Date | null;
  processingQueue: number;
  errorRate: number;
}

// Export all types
export type {
  DocumentUpload,
  DocumentMetadata,
  DocumentClass,
  DocumentAnalysis,
  StrategyInsight,
  RacingDocument,
  WeatherCondition,
  StrategyChatMessage,
  KnowledgeQuery,
  AnalysisRequest,
  AnalysisResponse,
  TacticalRecommendation,
  TrainingData,
  ProcessedDocument,
  DocumentEntity,
  DocumentRelationship,
  RacingScenario,
  TacticalPattern,
  AIPerformanceMetrics,
  StrategyChatSession,
  SimilaritySearchResult,
  AIModelConfig,
  KnowledgeBaseStats
};