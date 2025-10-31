import Anthropic from '@anthropic-ai/sdk';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface SailTrimAnalysis {
  overall_score: number; // 0-100
  sail_shape: {
    main_sail: {
      twist: number; // degrees
      camber: number; // percentage
      angle_of_attack: number; // degrees
      leech_tension: 'tight' | 'optimal' | 'loose';
      foot_tension: 'tight' | 'optimal' | 'loose';
    };
    jib: {
      twist: number;
      camber: number;
      angle_of_attack: number;
      sheet_angle: number;
      lead_position: 'forward' | 'optimal' | 'aft';
    };
    spinnaker?: {
      pole_height: number;
      twist: number;
      trim: 'overtrimmed' | 'optimal' | 'undertrimmed';
    };
  };
  issues_detected: string[];
  recommendations: SailTrimRecommendation[];
  wind_conditions: {
    apparent_wind_angle: number;
    estimated_wind_speed: number;
  };
  boat_setup: {
    heel_angle: number;
    mast_bend: number;
    forestay_tension: 'light' | 'medium' | 'heavy';
  };
}

interface SailTrimRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'main' | 'jib' | 'spinnaker' | 'setup';
  adjustment: string;
  reason: string;
  expected_improvement: string;
  control_instruction: string;
}

interface BoatPostureAnalysis {
  crew_position: {
    helmsman: {
      position: 'too_far_aft' | 'optimal' | 'too_far_forward';
      body_angle: number;
      weight_distribution: 'good' | 'needs_adjustment';
    };
    crew: {
      hiking_efficiency: number; // 0-100
      weight_placement: 'too_far_aft' | 'optimal' | 'too_far_forward';
      coordination: 'poor' | 'good' | 'excellent';
    };
  };
  boat_trim: {
    fore_aft: number; // negative = bow down
    heel_angle: number;
    optimal_heel: number;
    trim_efficiency: number; // 0-100
  };
  recommendations: string[];
}

interface VideoAnalysis {
  session_summary: {
    total_duration: number; // seconds
    conditions_analyzed: string;
    key_moments: number[]; // timestamps
  };
  technique_analysis: {
    tacking_efficiency: number; // 0-100
    jibing_efficiency: number; // 0-100
    mark_roundings: number; // 0-100
    sail_handling: number; // 0-100
  };
  improvement_areas: string[];
  tactical_observations: string[];
  specific_feedback: {
    timestamp: number;
    observation: string;
    recommendation: string;
  }[];
}

export class ComputerVisionService {
  private static genAI = new Anthropic({ apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '', dangerouslyAllowBrowser: true });

  /**
   * Analyze sail trim from a photo or video frame
   */
  static async analyzeSailTrim(
    imageUri: string,
    windConditions?: {
      speed: number;
      angle: number;
    },
    boatClass?: string
  ): Promise<SailTrimAnalysis> {
    try {

      // Convert image to base64
      const base64Image = await this.convertImageToBase64(imageUri);

      const prompt = `
Analyze this sailing image for sail trim optimization. You are an expert sailing coach with computer vision capabilities.

BOAT CLASS: ${boatClass || 'Unknown'}
WIND CONDITIONS: ${windConditions ? `${windConditions.speed} knots at ${windConditions.angle}° apparent` : 'Estimate from image'}

Analyze the following aspects:

1. SAIL SHAPE ANALYSIS:
   - Main sail: twist, camber, angle of attack, leech/foot tension
   - Jib: twist, camber, angle of attack, sheet angle, lead position
   - Spinnaker (if visible): pole height, twist, trim

2. BOAT SETUP:
   - Heel angle and its appropriateness for conditions
   - Mast bend and forestay tension
   - Overall boat balance

3. WIND READING:
   - Estimate apparent wind angle from sail angles
   - Estimate wind speed from sail shape and boat heel

4. OPTIMIZATION OPPORTUNITIES:
   - Identify specific adjustments needed
   - Prioritize recommendations by impact
   - Provide specific control instructions

Look for telltales, sail shape, boat angle, crew position, and any visible trim indicators.

Respond in this JSON format:
{
  "overall_score": 85,
  "sail_shape": {
    "main_sail": {
      "twist": 15,
      "camber": 12,
      "angle_of_attack": 8,
      "leech_tension": "optimal",
      "foot_tension": "tight"
    },
    "jib": {
      "twist": 10,
      "camber": 14,
      "angle_of_attack": 6,
      "sheet_angle": 12,
      "lead_position": "optimal"
    }
  },
  "issues_detected": ["Main leech too tight", "Jib lead could move forward"],
  "recommendations": [
    {
      "priority": "high",
      "category": "main",
      "adjustment": "Ease mainsheet 2 inches",
      "reason": "Leech is hooking, reducing efficiency",
      "expected_improvement": "2-3% speed increase",
      "control_instruction": "Ease mainsheet until top telltale streams"
    }
  ],
  "wind_conditions": {
    "apparent_wind_angle": 35,
    "estimated_wind_speed": 12
  },
  "boat_setup": {
    "heel_angle": 18,
    "mast_bend": 3,
    "forestay_tension": "medium"
  }
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback analysis
      return this.generateFallbackSailAnalysis();
    } catch (error) {
      console.error('Error analyzing sail trim:', error);
      return this.generateFallbackSailAnalysis();
    }
  }

  /**
   * Analyze crew position and boat posture
   */
  static async analyzeBoatPosture(imageUri: string): Promise<BoatPostureAnalysis> {
    try {
      const base64Image = await this.convertImageToBase64(imageUri);

      const prompt = `
Analyze this sailing image for crew position and boat posture optimization.

Focus on:

1. CREW POSITIONING:
   - Helmsman position relative to optimal helm position
   - Crew hiking efficiency and weight distribution
   - Body angles and coordination

2. BOAT TRIM:
   - Fore/aft trim (bow up/down)
   - Heel angle appropriateness
   - Weight distribution effects

3. EFFICIENCY ASSESSMENT:
   - Rate hiking efficiency (0-100)
   - Assess trim optimization
   - Identify coordination issues

4. SPECIFIC RECOMMENDATIONS:
   - Crew movement suggestions
   - Weight redistribution advice
   - Technique improvements

Respond in this JSON format:
{
  "crew_position": {
    "helmsman": {
      "position": "optimal",
      "body_angle": 45,
      "weight_distribution": "good"
    },
    "crew": {
      "hiking_efficiency": 85,
      "weight_placement": "optimal",
      "coordination": "good"
    }
  },
  "boat_trim": {
    "fore_aft": -2,
    "heel_angle": 20,
    "optimal_heel": 18,
    "trim_efficiency": 90
  },
  "recommendations": [
    "Move crew weight forward 6 inches",
    "Increase hiking angle by 5 degrees"
  ]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackPostureAnalysis();
    } catch (error) {
      console.error('Error analyzing boat posture:', error);
      return this.generateFallbackPostureAnalysis();
    }
  }

  /**
   * Analyze video for sailing technique assessment
   */
  static async analyzeVideoTechnique(
    videoUri: string,
    analysisType: 'tacking' | 'jibing' | 'mark_rounding' | 'general'
  ): Promise<VideoAnalysis> {
    try {
      // Note: For production, this would extract key frames from video
      // For demo, we'll simulate video analysis


      const prompt = `
Analyze sailing technique video for ${analysisType} performance.

Based on video analysis (simulated for demo), provide detailed feedback on:

1. TECHNIQUE EFFICIENCY:
   - Rate overall execution (0-100)
   - Identify specific technique issues
   - Timing and coordination assessment

2. TACTICAL DECISIONS:
   - Strategic choices made
   - Timing of maneuvers
   - Positioning relative to competitors

3. IMPROVEMENT OPPORTUNITIES:
   - Specific technique adjustments
   - Timing improvements
   - Strategic alternatives

4. DETAILED FEEDBACK:
   - Timestamp-specific observations
   - Progressive improvement suggestions

Respond in this JSON format:
{
  "session_summary": {
    "total_duration": 300,
    "conditions_analyzed": "12-15 knot winds, moderate chop",
    "key_moments": [45, 120, 240]
  },
  "technique_analysis": {
    "tacking_efficiency": 75,
    "jibing_efficiency": 80,
    "mark_roundings": 70,
    "sail_handling": 85
  },
  "improvement_areas": [
    "Faster tack completion",
    "Better mark approach planning"
  ],
  "tactical_observations": [
    "Good use of wind shifts",
    "Conservative mark approaches"
  ],
  "specific_feedback": [
    {
      "timestamp": 45,
      "observation": "Slow tack completion",
      "recommendation": "Release jib sheet earlier in tack"
    }
  ]
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackVideoAnalysis();
    } catch (error) {
      console.error('Error analyzing video:', error);
      return this.generateFallbackVideoAnalysis();
    }
  }

  /**
   * Take and analyze real-time photo from camera
   */
  static async captureAndAnalyzeTrim(): Promise<{
    imageUri: string;
    analysis: SailTrimAnalysis;
  }> {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera permission not granted');
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        throw new Error('Image capture canceled');
      }

      const imageUri = result.assets[0].uri;

      // Analyze the captured image
      const analysis = await this.analyzeSailTrim(imageUri);

      return { imageUri, analysis };
    } catch (error) {
      console.error('Error capturing and analyzing:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple images for trend analysis
   */
  static async batchAnalyzeTrimTrends(
    imageUris: string[],
    timeStamps: number[]
  ): Promise<{
    trend_analysis: {
      improvement_over_time: boolean;
      key_changes: string[];
      consistency_score: number; // 0-100
    };
    individual_analyses: SailTrimAnalysis[];
    recommendations: string[];
  }> {
    try {
      const analyses = await Promise.all(
        imageUris.map(uri => this.analyzeSailTrim(uri))
      );

      // Analyze trends
      const scores = analyses.map(a => a.overall_score);
      const averageImprovement = scores[scores.length - 1] - scores[0];
      const consistency = this.calculateConsistency(scores);

      return {
        trend_analysis: {
          improvement_over_time: averageImprovement > 0,
          key_changes: this.identifyKeyChanges(analyses),
          consistency_score: consistency,
        },
        individual_analyses: analyses,
        recommendations: this.generateTrendRecommendations(analyses),
      };
    } catch (error) {
      console.error('Error in batch analysis:', error);
      throw error;
    }
  }

  // Helper methods

  private static async convertImageToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  private static calculateConsistency(scores: number[]): number {
    if (scores.length < 2) return 100;

    const variance = scores.reduce((acc, score, i, arr) => {
      const mean = arr.reduce((sum, s) => sum + s, 0) / arr.length;
      return acc + Math.pow(score - mean, 2);
    }, 0) / scores.length;

    return Math.max(0, 100 - Math.sqrt(variance));
  }

  private static identifyKeyChanges(analyses: SailTrimAnalysis[]): string[] {
    // Simplified change detection
    const changes: string[] = [];

    if (analyses.length >= 2) {
      const first = analyses[0];
      const last = analyses[analyses.length - 1];

      if (Math.abs(first.sail_shape.main_sail.twist - last.sail_shape.main_sail.twist) > 5) {
        changes.push('Significant change in main sail twist');
      }

      if (first.sail_shape.jib.lead_position !== last.sail_shape.jib.lead_position) {
        changes.push('Jib lead position adjustment');
      }
    }

    return changes;
  }

  private static generateTrendRecommendations(analyses: SailTrimAnalysis[]): string[] {
    const recommendations: string[] = [];

    if (analyses.length > 0) {
      const latestAnalysis = analyses[analyses.length - 1];

      if (latestAnalysis.overall_score < 70) {
        recommendations.push('Focus on basic sail trim fundamentals');
      }

      if (latestAnalysis.issues_detected.length > 3) {
        recommendations.push('Work on one trim aspect at a time for better progress');
      }
    }

    return recommendations;
  }

  // Fallback methods

  private static generateFallbackSailAnalysis(): SailTrimAnalysis {
    return {
      overall_score: 75,
      sail_shape: {
        main_sail: {
          twist: 12,
          camber: 10,
          angle_of_attack: 8,
          leech_tension: 'optimal',
          foot_tension: 'optimal',
        },
        jib: {
          twist: 8,
          camber: 12,
          angle_of_attack: 6,
          sheet_angle: 10,
          lead_position: 'optimal',
        },
      },
      issues_detected: ['Image analysis unavailable - using default assessment'],
      recommendations: [
        {
          priority: 'medium',
          category: 'main',
          adjustment: 'Check sail trim visually',
          reason: 'Computer vision analysis unavailable',
          expected_improvement: 'Proper trim assessment needed',
          control_instruction: 'Use telltales for guidance',
        },
      ],
      wind_conditions: {
        apparent_wind_angle: 30,
        estimated_wind_speed: 10,
      },
      boat_setup: {
        heel_angle: 15,
        mast_bend: 2,
        forestay_tension: 'medium',
      },
    };
  }

  private static generateFallbackPostureAnalysis(): BoatPostureAnalysis {
    return {
      crew_position: {
        helmsman: {
          position: 'optimal',
          body_angle: 45,
          weight_distribution: 'good',
        },
        crew: {
          hiking_efficiency: 80,
          weight_placement: 'optimal',
          coordination: 'good',
        },
      },
      boat_trim: {
        fore_aft: 0,
        heel_angle: 18,
        optimal_heel: 18,
        trim_efficiency: 85,
      },
      recommendations: ['Computer vision analysis unavailable - check crew position manually'],
    };
  }

  private static generateFallbackVideoAnalysis(): VideoAnalysis {
    return {
      session_summary: {
        total_duration: 300,
        conditions_analyzed: 'Analysis unavailable',
        key_moments: [],
      },
      technique_analysis: {
        tacking_efficiency: 75,
        jibing_efficiency: 75,
        mark_roundings: 75,
        sail_handling: 75,
      },
      improvement_areas: ['Video analysis unavailable'],
      tactical_observations: ['Manual review recommended'],
      specific_feedback: [],
    };
  }
}

export default ComputerVisionService;