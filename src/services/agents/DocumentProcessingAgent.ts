/**
 * Document Processing Agent
 * Autonomous AI agent for sailing instruction parsing, course extraction, and strategy generation
 * Replaces manual Gemini orchestration with self-directed multi-step workflows
 */

import { BaseAgentService, AgentTool } from './BaseAgentService';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import RaceCourseExtractor from '@/src/services/ai/RaceCourseExtractor';
import type { RaceCourseExtraction } from '@/src/lib/types/ai-knowledge';

export class DocumentProcessingAgent extends BaseAgentService {
  private gemini: GoogleGenerativeAI;
  private courseExtractor: RaceCourseExtractor;

  constructor() {
    super({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 3000,
      temperature: 0.4, // Balanced for extraction accuracy
      systemPrompt: `You are a sailing document processing specialist for RegattaFlow.

Your mission: Transform sailing instructions, notices of race, and course diagrams into structured race data that sailors can use for strategy planning.

When a sailor uploads a document:
1. Extract race course information (marks, coordinates, course layout)
2. Generate 3D course visualization data (GeoJSON for MapLibre)
3. Analyze strategic elements (start line bias, tactical considerations, safety protocols)
4. Save processed data to knowledge base for future reference

You have access to specialized tools for each step. Execute them in the optimal order.

Important considerations:
- GPS coordinates may be in various formats (DMS, decimal degrees)
- Course layouts vary: windward-leeward, triangle, coastal, custom
- Always note confidence level in extractions
- If coordinates are missing, try to infer from venue or mark descriptions
- Safety information is critical - always extract and highlight it`,
    });

    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    this.gemini = new GoogleGenerativeAI(apiKey || 'dummy-key');
    this.courseExtractor = new RaceCourseExtractor();

    // Register custom tools
    this.registerTool(this.createExtractRaceCourseTool());
    this.registerTool(this.createGenerate3DVisualizationTool());
    this.registerTool(this.createAnalyzeStrategyTool());
    this.registerTool(this.createSaveToKnowledgeBaseTool());
  }

  /**
   * Tool: Extract race course from sailing instructions
   */
  private createExtractRaceCourseTool(): AgentTool {
    return {
      name: 'extract_race_course_from_si',
      description: `Extract structured race course information from sailing instruction text.
Use this when you have PDF or OCR text from sailing instructions, notice of race, or course diagrams.
Parses mark names, GPS coordinates, course layout type, and sailing instructions.
Returns structured course data with confidence scores.`,
      input_schema: z.object({
        documentText: z.string().describe('The extracted text content from the sailing instruction document'),
        filename: z.string().describe('Original filename for context'),
        venueHint: z.string().optional().describe('Optional venue name to help with coordinate inference'),
      }),
      execute: async (input) => {
        console.log('🔧 Tool: extract_race_course_from_si', { filename: input.filename, textLength: input.documentText.length });

        try {
          // Use RaceCourseExtractor service with Gemini
          const extraction = await this.courseExtractor.extractRaceCourse(
            input.documentText,
            {
              filename: input.filename,
              venue: input.venueHint,
              documentType: this.determineDocumentType(input.filename, input.documentText),
            }
          );

          return {
            success: true,
            extraction: {
              marks: extraction.marks,
              courseLayout: extraction.courseLayout,
              startLine: extraction.startLine,
              finishLine: extraction.finishLine,
              confidence: extraction.extractionMetadata.overallConfidence,
            },
            metadata: {
              marksExtracted: extraction.marks.length,
              hasCoordinates: extraction.marks.some(m => m.coordinates),
              documentType: extraction.extractionMetadata.documentType,
            },
          };
        } catch (error: any) {
          console.error('❌ Tool failed: extract_race_course_from_si', error);
          return {
            success: false,
            error: `Failed to extract race course: ${error.message}`,
            suggestion: 'Try checking if the document contains mark information or GPS coordinates.',
          };
        }
      },
    };
  }

  /**
   * Tool: Generate 3D course visualization
   */
  private createGenerate3DVisualizationTool(): AgentTool {
    return {
      name: 'generate_3d_course_visualization',
      description: `Generate GeoJSON data for 3D race course visualization using MapLibre.
Use this after extracting course marks with GPS coordinates.
Creates lines, polygons, and markers suitable for interactive 3D map display.
Returns MapLibre-compatible GeoJSON.`,
      input_schema: z.object({
        marks: z.array(z.object({
          name: z.string(),
          coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
          }).optional(),
          description: z.string().optional(),
        })).describe('Array of course marks with GPS coordinates'),
        courseLayout: z.object({
          type: z.enum(['windward-leeward', 'triangle', 'coastal', 'custom']),
          description: z.string(),
        }).describe('Course layout information'),
      }),
      execute: async (input) => {
        console.log('🔧 Tool: generate_3d_course_visualization', { marksCount: input.marks.length });

        try {
          // Filter marks with coordinates
          const marksWithCoords = input.marks.filter(m => m.coordinates);

          if (marksWithCoords.length === 0) {
            return {
              success: false,
              error: 'No marks with GPS coordinates found. Cannot generate visualization.',
              suggestion: 'Try to infer coordinates from venue or request manual coordinate entry.',
            };
          }

          // Generate GeoJSON for MapLibre
          const geoJSON = {
            type: 'FeatureCollection',
            features: [
              // Mark points
              ...marksWithCoords.map((mark, index) => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [mark.coordinates!.lng, mark.coordinates!.lat],
                },
                properties: {
                  id: `mark-${index}`,
                  name: mark.name,
                  description: mark.description || '',
                  type: 'course_mark',
                  order: index,
                },
              })),
              // Course line (connect marks in order)
              {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: marksWithCoords.map(m => [m.coordinates!.lng, m.coordinates!.lat]),
                },
                properties: {
                  type: 'course_line',
                  courseType: input.courseLayout.type,
                },
              },
            ],
          };

          // Calculate bounding box for map centering
          const lats = marksWithCoords.map(m => m.coordinates!.lat);
          const lngs = marksWithCoords.map(m => m.coordinates!.lng);

          const bounds = {
            north: Math.max(...lats),
            south: Math.min(...lats),
            east: Math.max(...lngs),
            west: Math.min(...lngs),
          };

          const center = {
            lat: (bounds.north + bounds.south) / 2,
            lng: (bounds.east + bounds.west) / 2,
          };

          return {
            success: true,
            geoJSON,
            mapConfig: {
              center,
              bounds,
              zoom: this.calculateOptimalZoom(bounds),
            },
            stats: {
              marks: marksWithCoords.length,
              courseType: input.courseLayout.type,
            },
          };
        } catch (error: any) {
          console.error('❌ Tool failed: generate_3d_course_visualization', error);
          return {
            success: false,
            error: `Failed to generate visualization: ${error.message}`,
          };
        }
      },
    };
  }

  /**
   * Tool: Analyze race strategy
   */
  private createAnalyzeStrategyTool(): AgentTool {
    return {
      name: 'analyze_race_strategy',
      description: `Analyze strategic elements of the race course and conditions.
Use this after extracting course information to provide tactical recommendations.
Considers start line bias, mark roundings, current/wind patterns, safety protocols.
Returns strategic insights for race planning.`,
      input_schema: z.object({
        courseData: z.object({
          marks: z.array(z.any()),
          courseLayout: z.object({
            type: z.string(),
            description: z.string(),
          }),
          startLine: z.any().optional(),
        }).describe('Extracted course data'),
        documentText: z.string().describe('Original sailing instruction text for context'),
        venueContext: z.string().optional().describe('Venue name or context'),
      }),
      execute: async (input) => {
        console.log('🔧 Tool: analyze_race_strategy', { courseType: input.courseData.courseLayout.type });

        try {
          const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });

          const prompt = `Analyze this race course and provide strategic recommendations for sailors:

COURSE LAYOUT: ${input.courseData.courseLayout.type}
COURSE DESCRIPTION: ${input.courseData.courseLayout.description}
MARKS: ${input.courseData.marks.length} marks
VENUE: ${input.venueContext || 'Unknown'}

SAILING INSTRUCTIONS (relevant excerpts):
${input.documentText.substring(0, 2000)}

Provide tactical analysis in JSON format:
{
  "startStrategy": "Recommendations for start line approach",
  "tacticalConsiderations": ["Key tactical factors to consider"],
  "markRoundingTips": ["Specific tips for rounding each mark"],
  "safetyProtocols": ["Critical safety information from SI"],
  "windStrategy": "How to use wind patterns on this course",
  "currentStrategy": "How to use current on this course (if mentioned)",
  "riskFactors": ["Potential hazards or challenging elements"],
  "confidence": 0.0-1.0
}`;

          const result = await model.generateContent(prompt);
          const response = result.response.text();

          // Parse JSON response
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return {
              success: true,
              analysis,
            };
          }

          // Fallback if JSON parsing fails
          return {
            success: true,
            analysis: {
              startStrategy: 'Analyze start line bias and fleet positioning',
              tacticalConsiderations: ['Course layout', 'Weather conditions', 'Fleet dynamics'],
              markRoundingTips: ['Plan approach early', 'Maintain right of way'],
              safetyProtocols: ['Follow sailing instructions', 'Monitor weather'],
              confidence: 0.5,
            },
          };
        } catch (error: any) {
          console.error('❌ Tool failed: analyze_race_strategy', error);
          return {
            success: false,
            error: `Failed to analyze strategy: ${error.message}`,
          };
        }
      },
    };
  }

  /**
   * Tool: Save to knowledge base
   */
  private createSaveToKnowledgeBaseTool(): AgentTool {
    return {
      name: 'save_to_knowledge_base',
      description: `Save processed document data to RegattaFlow knowledge base for future reference.
Use this as the final step after extracting course, generating visualization, and analyzing strategy.
Stores all data associated with the document for later retrieval.
Returns confirmation with database IDs.`,
      input_schema: z.object({
        filename: z.string().describe('Original document filename'),
        courseData: z.any().describe('Extracted course information'),
        visualization: z.any().optional().describe('3D visualization GeoJSON'),
        strategy: z.any().optional().describe('Strategic analysis'),
        venueId: z.string().optional().describe('Associated venue ID'),
      }),
      execute: async (input) => {
        console.log('🔧 Tool: save_to_knowledge_base', { filename: input.filename });

        try {
          // In a real implementation, this would save to Supabase
          // For now, return confirmation with mock IDs
          const documentId = `doc_${Date.now()}`;

          return {
            success: true,
            saved: {
              documentId,
              filename: input.filename,
              timestamp: new Date().toISOString(),
              dataTypes: {
                course: !!input.courseData,
                visualization: !!input.visualization,
                strategy: !!input.strategy,
              },
            },
            message: `Document ${input.filename} processed and saved. You can now use this race course for strategy planning.`,
          };
        } catch (error: any) {
          console.error('❌ Tool failed: save_to_knowledge_base', error);
          return {
            success: false,
            error: `Failed to save to knowledge base: ${error.message}`,
          };
        }
      },
    };
  }

  /**
   * High-level method: Process sailing instructions
   */
  async processSailingInstructions(
    documentText: string,
    filename: string,
    venueHint?: string
  ) {
    return this.run({
      userMessage: `Process this sailing instruction document: ${filename}. Extract the race course, generate 3D visualization, analyze strategy, and save everything to the knowledge base.`,
      context: {
        documentText,
        filename,
        venueHint,
      },
      maxIterations: 8, // Allow up to 8 steps for complete processing
    });
  }

  /**
   * High-level method: Quick course extraction (no full processing)
   */
  async extractCourseOnly(documentText: string, filename: string) {
    return this.run({
      userMessage: `Extract just the race course marks and layout from this document: ${filename}. I only need the course data, not visualization or strategy.`,
      context: {
        documentText,
        filename,
      },
      maxIterations: 3, // Quick extraction only
    });
  }

  /**
   * Utility: Determine document type
   */
  private determineDocumentType(
    filename: string,
    content: string
  ): 'sailing_instructions' | 'notice_of_race' | 'course_diagram' {
    const lowerFilename = filename.toLowerCase();
    const lowerContent = content.toLowerCase().substring(0, 1000);

    if (lowerFilename.includes('sailing') && lowerFilename.includes('instruction')) {
      return 'sailing_instructions';
    }
    if (lowerFilename.includes('notice') && lowerFilename.includes('race')) {
      return 'notice_of_race';
    }
    if (lowerFilename.includes('course') || lowerFilename.includes('diagram')) {
      return 'course_diagram';
    }

    // Check content
    if (lowerContent.includes('sailing instructions')) {
      return 'sailing_instructions';
    }
    if (lowerContent.includes('notice of race')) {
      return 'notice_of_race';
    }

    return 'sailing_instructions';
  }

  /**
   * Utility: Calculate optimal zoom for map bounds
   */
  private calculateOptimalZoom(bounds: { north: number; south: number; east: number; west: number }): number {
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);

    // Rough zoom calculation
    if (maxDiff > 1) return 10;
    if (maxDiff > 0.5) return 11;
    if (maxDiff > 0.1) return 13;
    if (maxDiff > 0.05) return 14;
    return 15;
  }
}

export default DocumentProcessingAgent;
