// @ts-nocheck

/**
 * Race Course Extractor Service
 * Specialized AI service for extracting race course information from sailing instructions
 * Implements the core document parsing and course extraction system from the master plan
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  RaceCourseExtraction,
  CoordinateValidation,
  DocumentUpload,
  DocumentAnalysis
} from '@/lib/types/ai-knowledge';

export class RaceCourseExtractor {
  // private anthropic: Anthropic; // Disabled for web compatibility

  constructor() {
    // NOTE: Anthropic SDK disabled for web compatibility
    // Requires backend API endpoint for production
    /*
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not found. Set EXPO_PUBLIC_ANTHROPIC_API_KEY environment variable.');
    }
    // TODO: Move to Supabase Edge Function for production to protect API key
        // this.anthropic = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true // Development only - move to backend for production
    });
    */
  }

  /**
   * Extract comprehensive race course information from sailing instructions
   * This is the core AI document parsing and course extraction system
   */
  async extractRaceCourse(
    documentText: string,
    metadata: {
      filename: string;
      venue?: string;
      documentType?: 'sailing_instructions' | 'notice_of_race' | 'course_diagram';
    }
  ): Promise<RaceCourseExtraction> {

    try {
      const prompt = this.buildCourseExtractionPrompt(documentText, metadata);

      // Using Claude 3.5 Haiku for cost optimization (12x cheaper)
      // Excellent for structured extraction tasks
      // Upgrade to 'claude-3-5-sonnet-latest' if quality issues emerge
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.1, // Low temperature for factual extraction
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Extract text from Claude's response
      const response = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Parse the structured JSON response
      const extraction = this.parseExtractionResponse(response, metadata);

      // Validate and enhance coordinate data
      extraction.marks = await this.validateAndEnhanceCoordinates(extraction.marks);

      // Calculate overall confidence score
      extraction.extractionMetadata.overallConfidence = this.calculateOverallConfidence(extraction);

      return extraction;

    } catch (error: any) {

      // Return fallback extraction with low confidence
      return this.createFallbackExtraction(metadata, error.message);
    }
  }

  /**
   * Validate GPS coordinates and suggest corrections
   */
  async validateCoordinates(
    latitude: number,
    longitude: number,
    context?: string
  ): Promise<CoordinateValidation> {
    // Basic coordinate validation
    const isValidLat = latitude >= -90 && latitude <= 90;
    const isValidLng = longitude >= -180 && longitude <= 180;

    const warnings: string[] = [];

    // Check for common format errors
    if (Math.abs(latitude) > 90) {
      warnings.push('Latitude appears to be out of valid range (-90 to 90)');
    }

    if (Math.abs(longitude) > 180) {
      warnings.push('Longitude appears to be out of valid range (-180 to 180)');
    }

    // Check for degree/minute/second format confusion
    if (Math.abs(latitude) > 90 && Math.abs(latitude) < 9000) {
      const correctedLat = this.convertDMSToDecimal(latitude);
      if (correctedLat >= -90 && correctedLat <= 90) {
        return {
          isValid: false,
          confidence: 0.8,
          suggestedCorrection: {
            latitude: correctedLat,
            longitude: longitude,
            reason: 'Appears to be in degree-minute-second format'
          },
          warnings
        };
      }
    }

    // Similar check for longitude
    if (Math.abs(longitude) > 180 && Math.abs(longitude) < 36000) {
      const correctedLng = this.convertDMSToDecimal(longitude);
      if (correctedLng >= -180 && correctedLng <= 180) {
        return {
          isValid: false,
          confidence: 0.8,
          suggestedCorrection: {
            latitude: latitude,
            longitude: correctedLng,
            reason: 'Appears to be in degree-minute-second format'
          },
          warnings
        };
      }
    }

    return {
      isValid: isValidLat && isValidLng,
      confidence: isValidLat && isValidLng ? 0.95 : 0.1,
      warnings
    };
  }

  /**
   * Build specialized prompt for race course extraction
   * Implements the intelligent course extraction from the race strategy planning document
   */
  private buildCourseExtractionPrompt(
    documentText: string,
    metadata: {
      filename: string;
      venue?: string;
      documentType?: string;
    }
  ): string {
    return `
You are a professional sailing race analyst specializing in extracting race course information from sailing instructions.

DOCUMENT METADATA:
- Filename: ${metadata.filename}
- Venue: ${metadata.venue || 'Unknown'}
- Document Type: ${metadata.documentType || 'sailing_instructions'}

DOCUMENT CONTENT:
${documentText}

EXTRACTION REQUIREMENTS:
Extract comprehensive race course information and format as valid JSON with the following structure:

{
  "courseLayout": {
    "type": "windward_leeward" | "triangle" | "trapezoid" | "olympic" | "reaching" | "other",
    "description": "Detailed description of course layout",
    "confidence": 0.0-1.0
  },
  "marks": [
    {
      "name": "Mark name (e.g., 'Start Pin', 'Windward Mark', 'Leeward Gate')",
      "position": {
        "latitude": number (decimal degrees, null if not found),
        "longitude": number (decimal degrees, null if not found),
        "description": "Position description from document",
        "confidence": 0.0-1.0
      },
      "type": "start" | "windward" | "leeward" | "wing" | "gate" | "finish" | "other",
      "color": "Color if mentioned",
      "shape": "Shape if mentioned (sphere, cylinder, inflatable)"
    }
  ],
  "boundaries": [
    {
      "type": "racing_area" | "no_go" | "restricted" | "safety",
      "description": "Boundary description",
      "coordinates": [{"latitude": number, "longitude": number}],
      "confidence": 0.0-1.0
    }
  ],
  "schedule": {
    "warningSignal": "ISO date string if found",
    "preparatorySignal": "ISO date string if found",
    "startingSignal": "ISO date string if found",
    "timeLimit": number (minutes),
    "sequences": [{"class": "Fleet/class name", "startTime": "ISO date string"}],
    "confidence": 0.0-1.0
  },
  "distances": {
    "beat": {"distance": number, "unit": "nm"|"km"|"m", "confidence": 0.0-1.0},
    "run": {"distance": number, "unit": "nm"|"km"|"m", "confidence": 0.0-1.0},
    "total": {"distance": number, "unit": "nm"|"km"|"m", "confidence": 0.0-1.0}
  },
  "startLine": {
    "type": "line" | "gate",
    "description": "Start line description",
    "bias": "port" | "starboard" | "neutral" (if determinable),
    "length": number (meters if specified),
    "confidence": 0.0-1.0
  },
  "requirements": {
    "equipment": ["Required equipment items"],
    "crew": ["Crew requirements"],
    "safety": ["Safety requirements"],
    "registration": ["Registration requirements"],
    "confidence": 0.0-1.0
  },
  "weatherLimits": {
    "windMin": number (knots),
    "windMax": number (knots),
    "waveMax": number (meters),
    "visibility": number (meters/miles),
    "thunderstorm": boolean,
    "confidence": 0.0-1.0
  },
  "communication": {
    "vhfChannel": "VHF channel number (e.g., '72')",
    "callSign": "Radio call sign if specified",
    "emergencyContact": "Emergency contact information",
    "raceCommittee": "Race committee contact information",
    "confidence": 0.0-1.0
  },
  "regulations": {
    "specialFlags": ["List of special flags mentioned (e.g., 'P Flag', 'I Flag', 'Z Flag')"],
    "penalties": ["Penalty information"],
    "protests": ["Protest procedures"],
    "confidence": 0.0-1.0
  }
}

COORDINATE EXTRACTION GUIDELINES:
1. Look for GPS coordinates in various formats:
   - Decimal degrees (e.g., 22.123456, -114.987654)
   - Degrees/minutes/seconds (e.g., 22°07'24.4"N 114°59'15.5"E)
   - Degrees/decimal minutes (e.g., 22°07.407'N 114°59.258'E)

2. Convert all coordinates to decimal degrees format

3. Set confidence based on:
   - Exact coordinates found: 0.9-1.0
   - Approximate coordinates: 0.6-0.8
   - Descriptive position only: 0.3-0.5
   - No position information: 0.1

4. Common sailing mark names to recognize:
   - Start marks: "Start Pin", "Committee Boat", "RC Boat"
   - Course marks: "Windward Mark", "Leeward Mark/Gate", "Wing Mark"
   - Finish: "Finish Line", "Finish Pin"

5. Course type recognition:
   - Windward/Leeward: Start → Windward → Leeward → Finish
   - Triangle: Three marks forming triangle
   - Olympic: Complex multi-mark course
   - Trapezoid: Four marks in trapezoid shape

CONFIDENCE SCORING:
- High (0.8-1.0): Explicit information clearly stated
- Medium (0.5-0.7): Implied or partially stated information
- Low (0.1-0.4): Inferred or uncertain information

CRITICAL: Return ONLY the JSON object above. No explanations, no apologies, no additional text. Just the JSON.
    `;
  }

  /**
   * Parse the AI extraction response into structured data
   */
  private parseExtractionResponse(
    response: string,
    metadata: {
      filename: string;
      venue?: string;
      documentType?: string;
    }
  ): RaceCourseExtraction {
    try {
      // Clean the response to extract JSON
      const cleanedResponse = response
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^\s*```\s*/, '')
        .replace(/\s*```\s*$/, '')
        .trim();

      const parsedData = JSON.parse(cleanedResponse);

      // Convert date strings to Date objects
      if (parsedData.schedule) {
        ['warningSignal', 'preparatorySignal', 'startingSignal'].forEach(field => {
          if (parsedData.schedule[field]) {
            parsedData.schedule[field] = new Date(parsedData.schedule[field]);
          }
        });

        if (parsedData.schedule.sequences) {
          parsedData.schedule.sequences.forEach((seq: any) => {
            if (seq.startTime) {
              seq.startTime = new Date(seq.startTime);
            }
          });
        }
      }

      // Add extraction metadata
      const extraction: RaceCourseExtraction = {
        ...parsedData,
        extractionMetadata: {
          documentType: (metadata.documentType || 'sailing_instructions') as any,
          source: metadata.filename,
          extractedAt: new Date(),
          overallConfidence: 0, // Will be calculated separately
          processingNotes: []
        }
      };

      return extraction;

    } catch (error) {
      console.error('Failed to parse extraction response:', error);
      return this.createFallbackExtraction(metadata, `JSON parsing failed: ${error}`);
    }
  }

  /**
   * Validate and enhance coordinate data for extracted marks
   */
  private async validateAndEnhanceCoordinates(
    marks: RaceCourseExtraction['marks']
  ): Promise<RaceCourseExtraction['marks']> {
    const enhancedMarks = [...marks];

    for (let i = 0; i < enhancedMarks.length; i++) {
      const mark = enhancedMarks[i];

      if (mark.position?.latitude && mark.position?.longitude) {
        const validation = await this.validateCoordinates(
          mark.position.latitude,
          mark.position.longitude,
          mark.name
        );

        if (!validation.isValid && validation.suggestedCorrection) {
          // Apply suggested correction
          mark.position.latitude = validation.suggestedCorrection.latitude;
          mark.position.longitude = validation.suggestedCorrection.longitude;
          mark.position.description += ` (Corrected: ${validation.suggestedCorrection.reason})`;
          mark.position.confidence = Math.min(mark.position.confidence, validation.confidence);
        }
      }
    }

    return enhancedMarks;
  }

  /**
   * Calculate overall confidence score based on all extraction components
   */
  private calculateOverallConfidence(extraction: RaceCourseExtraction): number {
    const confidenceScores: number[] = [];

    // Course layout confidence (with fallback)
    if (extraction.courseLayout && typeof extraction.courseLayout.confidence === 'number') {
      confidenceScores.push(extraction.courseLayout.confidence);
    } else {
      confidenceScores.push(0.5); // Default moderate confidence
    }

    // Marks confidence (average of all mark confidences)
    if (extraction.marks.length > 0) {
      const markConfidences = extraction.marks
        .map(mark => mark.position?.confidence || 0.1)
        .filter(conf => conf > 0);

      if (markConfidences.length > 0) {
        confidenceScores.push(
          markConfidences.reduce((sum, conf) => sum + conf, 0) / markConfidences.length
        );
      }
    }

    // Schedule confidence (with fallback)
    if (extraction.schedule && typeof extraction.schedule.confidence === 'number') {
      confidenceScores.push(extraction.schedule.confidence);
    } else {
      confidenceScores.push(0.5);
    }

    // Requirements confidence (with fallback)
    if (extraction.requirements && typeof extraction.requirements.confidence === 'number') {
      confidenceScores.push(extraction.requirements.confidence);
    } else {
      confidenceScores.push(0.5);
    }

    // Start line confidence (with fallback)
    if (extraction.startLine && typeof extraction.startLine.confidence === 'number') {
      confidenceScores.push(extraction.startLine.confidence);
    } else {
      confidenceScores.push(0.5);
    }

    // Calculate weighted average (more weight on course layout and marks)
    const weights = [0.3, 0.4, 0.1, 0.1, 0.1]; // Course, Marks, Schedule, Requirements, StartLine
    const weightedSum = confidenceScores.reduce((sum, score, index) => {
      return sum + (score * (weights[index] || 0.1));
    }, 0);

    const totalWeight = weights.slice(0, confidenceScores.length).reduce((sum, w) => sum + w, 0);

    return Math.min(Math.max(weightedSum / totalWeight, 0), 1);
  }

  /**
   * Create fallback extraction when AI processing fails
   */
  private createFallbackExtraction(
    metadata: {
      filename: string;
      venue?: string;
      documentType?: string;
    },
    error: string
  ): RaceCourseExtraction {
    return {
      courseLayout: {
        type: 'other',
        description: 'Course layout could not be determined from document',
        confidence: 0.1
      },
      marks: [],
      boundaries: [],
      schedule: {
        confidence: 0.1
      },
      distances: {},
      startLine: {
        type: 'line',
        description: 'Start line information not found',
        confidence: 0.1
      },
      requirements: {
        equipment: [],
        crew: [],
        safety: [],
        registration: [],
        confidence: 0.1
      },
      weatherLimits: {
        confidence: 0.1
      },
      communication: {
        confidence: 0.1
      },
      regulations: {
        confidence: 0.1
      },
      extractionMetadata: {
        documentType: (metadata.documentType || 'sailing_instructions') as any,
        source: metadata.filename,
        extractedAt: new Date(),
        overallConfidence: 0.1,
        processingNotes: [`Extraction failed: ${error}`]
      }
    };
  }

  /**
   * Convert degree-minute-second format to decimal degrees
   */
  private convertDMSToDecimal(dms: number): number {
    const degrees = Math.floor(Math.abs(dms) / 10000);
    const minutes = Math.floor((Math.abs(dms) % 10000) / 100);
    const seconds = Math.abs(dms) % 100;

    const decimal = degrees + (minutes / 60) + (seconds / 3600);
    return dms < 0 ? -decimal : decimal;
  }

  /**
   * Get extraction statistics for monitoring system performance
   */
  getExtractionStats() {
    return {
      service: 'RaceCourseExtractor',
      version: '1.0.0',
      supportedFormats: ['sailing_instructions', 'notice_of_race', 'course_diagram'],
      supportedCoordinateFormats: ['decimal', 'dms', 'dm'],
      features: [
        'course_layout_detection',
        'gps_coordinate_extraction',
        'mark_identification',
        'schedule_parsing',
        'boundary_detection',
        'requirement_extraction'
      ]
    };
  }
}

export default RaceCourseExtractor;
