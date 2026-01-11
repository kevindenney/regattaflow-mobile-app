/**
 * SailAnalysisAIService
 *
 * AI-powered sail inspection analysis using Claude Vision.
 * Analyzes photos of sails for damage, wear, and condition issues.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system/legacy';

// =============================================================================
// Types
// =============================================================================

export type SailZone = 'head' | 'leech' | 'foot' | 'luff' | 'battens' | 'cloth' | 'overview' | 'detail';
export type SailType = 'mainsail' | 'jib' | 'genoa' | 'spinnaker' | 'code_zero' | 'storm_jib' | 'trysail';
export type DamageSeverity = 'minor' | 'moderate' | 'severe' | 'critical';
export type DamageType =
  | 'uv_damage'
  | 'stitching_failure'
  | 'delamination'
  | 'chafe'
  | 'tear'
  | 'mildew'
  | 'hardware_wear'
  | 'batten_pocket_wear'
  | 'shape_distortion'
  | 'edge_fraying'
  | 'discoloration'
  | 'stretch';

export interface SailContext {
  sailType: SailType;
  sailmaker?: string;
  ageMonths?: number;
  raceHours?: number;
  lastInspectionDate?: Date;
  boatClass?: string;
}

export interface DetectedIssue {
  type: DamageType;
  severity: DamageSeverity;
  description: string;
  locationInImage?: string;
  confidence: number;
}

export interface ZoneAnalysisResult {
  zone: SailZone;
  conditionScore: number; // 0-100
  issues: DetectedIssue[];
  recommendations: string[];
  raceReady: boolean;
  aiNotes: string;
  confidence: number;
  processingTimeMs: number;
}

export interface OverallSailAssessment {
  overallScore: number; // 0-100
  raceReady: boolean;
  zoneScores: Record<SailZone, number>;
  criticalIssues: DetectedIssue[];
  allIssues: DetectedIssue[];
  prioritizedRecommendations: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    reasoning: string;
    estimatedCost?: string;
  }[];
  estimatedRemainingLife: string;
  nextInspectionRecommendation: string;
  summary: string;
}

export interface QuickInspectionResult {
  overallScore: number;
  raceReady: boolean;
  estimatedZoneScores: Record<SailZone, number>;
  visibleIssues: DetectedIssue[];
  recommendations: string[];
  confidenceNote: string;
}

// =============================================================================
// Zone-Specific Prompts
// =============================================================================

const ZONE_PROMPTS: Record<SailZone, string> = {
  head: `
Analyze this sail photograph focusing on the HEAD (top) area of the sail.

Evaluate these specific aspects:

1. HEADBOARD CONDITION
   - Hardware integrity (shackle holes, boltrope attachment)
   - Headboard plate condition
   - Stitching around headboard reinforcement

2. UV DAMAGE
   - Fabric discoloration near head (most exposed area)
   - Brittleness indicators in thread
   - Fading patterns

3. REINFORCEMENT PATCHES
   - Patch adhesion and edges
   - Stitching integrity on patches
   - Signs of peeling or separation

4. HALYARD ATTACHMENT AREA
   - Chafe from halyard
   - Wear around attachment point
   - Hardware wear marks
`,

  leech: `
Analyze this sail photograph focusing on the LEECH (trailing/back edge) of the sail.

Evaluate these specific aspects:

1. LEECH LINE AND TAPE
   - Leech tape condition and adhesion
   - Leech line chafe
   - Edge binding integrity

2. TELLTALE PATCHES
   - Telltale attachment points
   - Reinforcement patch condition
   - Signs of flutter damage

3. FLUTTER/EDGE DAMAGE
   - Edge fraying
   - Delamination at edge
   - Wear from repeated movement

4. LEECH SHAPE
   - Signs of stretch or distortion
   - Hook or curl indicators
   - Panel seam condition near leech
`,

  foot: `
Analyze this sail photograph focusing on the FOOT (bottom edge) of the sail.

Evaluate these specific aspects:

1. TACK AND CLEW AREAS
   - Hardware wear and condition
   - Reinforcement patch integrity
   - Stitching stress points

2. FOOT TAPE/BOLTROPE
   - Boltrope or foot tape condition
   - Attachment to sail body
   - Chafe marks from boom

3. REEF POINTS (if visible)
   - Reef cringle condition
   - Reef tie attachment points
   - Reinforcement around reef points

4. OUTHAUL AREA
   - Wear from outhaul tension
   - Clew attachment point
   - Hardware marks
`,

  luff: `
Analyze this sail photograph focusing on the LUFF (leading/front edge) of the sail.

Evaluate these specific aspects:

1. LUFF ATTACHMENT HARDWARE
   - Hanks, slides, or bolt rope condition
   - Attachment point wear
   - Hardware corrosion

2. LUFF TAPE/ROPE
   - Luff tape adhesion
   - Bolt rope condition (if applicable)
   - Edge binding integrity

3. CUNNINGHAM AREA
   - Cunningham cringle condition
   - Reinforcement around cunningham
   - Wear from cunningham use

4. ENTRY SHAPE
   - Signs of stretch affecting entry
   - Panel seam condition
   - Draft position indicators
`,

  battens: `
Analyze this sail photograph focusing on the BATTEN POCKETS and battens.

Evaluate these specific aspects:

1. BATTEN POCKET CONDITION
   - Pocket entry wear
   - Stitching on pocket seams
   - Velcro/closure condition
   - Chafe from batten ends

2. BATTEN CAPS
   - Cap/end fitting condition
   - Signs of batten migration
   - Compression damage

3. POCKET REINFORCEMENT
   - Reinforcement patch condition
   - Stress cracking around pockets
   - Corner wear

4. BATTEN FIT
   - Signs of batten too tight/loose
   - Pocket stretching
   - Evidence of batten breakage
`,

  cloth: `
Analyze this sail photograph focusing on the CLOTH/BODY of the sail.

Evaluate these specific aspects:

1. FABRIC CONDITION
   - Overall cloth integrity
   - UV degradation patterns
   - Stretch or distortion

2. PANEL SEAMS
   - Seam stitching condition
   - Seam tape adhesion
   - Thread degradation

3. SURFACE ISSUES
   - Mildew or staining
   - Delamination (if laminate sail)
   - Surface coating wear

4. SHAPE INDICATORS
   - Draft position evidence
   - Wrinkle patterns
   - Load distribution signs
`,

  overview: `
Analyze this overall/general photograph of the sail.

Provide a comprehensive assessment including:

1. GENERAL CONDITION
   - Overall sail appearance
   - Visible damage or wear
   - Shape integrity

2. KEY ISSUES VISIBLE
   - Most obvious problems
   - Areas of concern
   - Immediate attention needed

3. ESTIMATED AGE/WEAR
   - Signs of use intensity
   - Overall degradation level
   - Remaining useful life indicators

4. RACE READINESS
   - Quick assessment of race suitability
   - Safety concerns
   - Performance impact
`,

  detail: `
Analyze this detail/close-up photograph of a specific sail area.

Focus on:

1. DETAILED CONDITION
   - Specific damage visible
   - Material state
   - Repair quality (if previously repaired)

2. SEVERITY ASSESSMENT
   - How serious is the issue
   - Progression indicators
   - Urgency of attention needed

3. REPAIR FEASIBILITY
   - Can this be repaired
   - Professional vs DIY repair
   - Repair vs replacement consideration
`,
};

// =============================================================================
// Service Class
// =============================================================================

export class SailAnalysisAIService {
  private static client = new Anthropic({
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
    dangerouslyAllowBrowser: true,
  });

  /**
   * Analyze a specific zone of the sail from a photo
   */
  static async analyzeZonePhoto(
    photoBase64: string,
    zone: SailZone,
    context?: SailContext
  ): Promise<ZoneAnalysisResult> {
    const startTime = Date.now();

    try {
      const zonePrompt = ZONE_PROMPTS[zone];

      const prompt = `
You are an expert sail inspector with decades of experience analyzing sail condition for racing yachts.

${zonePrompt}

SAIL CONTEXT:
- Sail Type: ${context?.sailType || 'Unknown'}
- Sailmaker: ${context?.sailmaker || 'Unknown'}
- Age: ${context?.ageMonths ? `${context.ageMonths} months` : 'Unknown'}
- Racing Hours: ${context?.raceHours || 'Unknown'}
- Boat Class: ${context?.boatClass || 'Unknown'}

Analyze the image and respond with this exact JSON structure:
{
  "condition_score": 85,
  "issues": [
    {
      "type": "uv_damage",
      "severity": "minor",
      "description": "Light UV fading visible near head reinforcement",
      "location_in_image": "upper left quadrant",
      "confidence": 0.85
    }
  ],
  "recommendations": [
    "Apply UV protectant spray before storage",
    "Monitor fading progression over next 3-4 races"
  ],
  "race_ready": true,
  "ai_notes": "Overall good condition for this zone. Minor cosmetic issues only.",
  "confidence": 0.88
}

Severity levels: minor (cosmetic/monitor), moderate (schedule repair), severe (repair before racing), critical (do not use)
Damage types: uv_damage, stitching_failure, delamination, chafe, tear, mildew, hardware_wear, batten_pocket_wear, shape_distortion, edge_fraying, discoloration, stretch

Be conservative on race_ready - if there's any safety concern, set to false.
`;

      const message = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: photoBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        }],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          zone,
          conditionScore: parsed.condition_score,
          issues: parsed.issues.map((i: any) => ({
            type: i.type as DamageType,
            severity: i.severity as DamageSeverity,
            description: i.description,
            locationInImage: i.location_in_image,
            confidence: i.confidence,
          })),
          recommendations: parsed.recommendations,
          raceReady: parsed.race_ready,
          aiNotes: parsed.ai_notes,
          confidence: parsed.confidence,
          processingTimeMs: Date.now() - startTime,
        };
      }

      return this.generateFallbackZoneResult(zone, startTime);
    } catch (error) {
      console.error(`Error analyzing ${zone} zone:`, error);
      return this.generateFallbackZoneResult(zone, startTime);
    }
  }

  /**
   * Quick inspection from a single overview photo
   */
  static async performQuickInspection(
    photoBase64: string,
    context?: SailContext
  ): Promise<QuickInspectionResult> {
    try {
      const prompt = `
You are an expert sail inspector. Analyze this sail photo and provide a quick overall assessment.

SAIL CONTEXT:
- Sail Type: ${context?.sailType || 'Unknown'}
- Sailmaker: ${context?.sailmaker || 'Unknown'}
- Age: ${context?.ageMonths ? `${context.ageMonths} months` : 'Unknown'}
- Boat Class: ${context?.boatClass || 'Unknown'}

From this single photo, estimate the condition of each sail zone and identify any visible issues.

Respond with this JSON structure:
{
  "overall_score": 78,
  "race_ready": true,
  "estimated_zone_scores": {
    "head": 85,
    "leech": 75,
    "foot": 80,
    "luff": 82,
    "battens": 70,
    "cloth": 78
  },
  "visible_issues": [
    {
      "type": "batten_pocket_wear",
      "severity": "moderate",
      "description": "Visible wear at batten pocket entries",
      "confidence": 0.75
    }
  ],
  "recommendations": [
    "Consider detailed inspection of batten pockets",
    "Check leech tape condition before next race"
  ],
  "confidence_note": "Limited view - full inspection recommended for accurate assessment"
}

Note: This is a quick assessment. Flag any areas that warrant detailed inspection.
`;

      const message = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        temperature: 0.2,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: photoBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        }],
      });

      const response = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          overallScore: parsed.overall_score,
          raceReady: parsed.race_ready,
          estimatedZoneScores: parsed.estimated_zone_scores,
          visibleIssues: parsed.visible_issues.map((i: any) => ({
            type: i.type as DamageType,
            severity: i.severity as DamageSeverity,
            description: i.description,
            confidence: i.confidence,
          })),
          recommendations: parsed.recommendations,
          confidenceNote: parsed.confidence_note,
        };
      }

      return this.generateFallbackQuickResult();
    } catch (error) {
      console.error('Error in quick inspection:', error);
      return this.generateFallbackQuickResult();
    }
  }

  /**
   * Generate overall assessment from zone results
   */
  static async generateOverallAssessment(
    zoneResults: ZoneAnalysisResult[],
    context?: SailContext
  ): Promise<OverallSailAssessment> {
    // Calculate overall score (weighted average)
    const zoneWeights: Record<SailZone, number> = {
      head: 0.15,
      leech: 0.18,
      foot: 0.15,
      luff: 0.18,
      battens: 0.14,
      cloth: 0.20,
      overview: 0,
      detail: 0,
    };

    let totalWeight = 0;
    let weightedScore = 0;
    const zoneScores: Partial<Record<SailZone, number>> = {};

    for (const result of zoneResults) {
      const weight = zoneWeights[result.zone] || 0;
      if (weight > 0) {
        weightedScore += result.conditionScore * weight;
        totalWeight += weight;
        zoneScores[result.zone] = result.conditionScore;
      }
    }

    const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;

    // Collect all issues
    const allIssues = zoneResults.flatMap(r => r.issues);
    const criticalIssues = allIssues.filter(
      i => i.severity === 'critical' || i.severity === 'severe'
    );

    // Determine race readiness
    const raceReady = criticalIssues.length === 0 &&
                      zoneResults.every(r => r.raceReady) &&
                      overallScore >= 60;

    // Generate prioritized recommendations
    const recommendations = this.generatePrioritizedRecommendations(allIssues, overallScore);

    // Estimate remaining life
    const remainingLife = this.estimateRemainingLife(overallScore, context);

    // Next inspection recommendation
    const nextInspection = this.recommendNextInspection(overallScore, allIssues);

    // Generate summary
    const summary = this.generateSummary(overallScore, raceReady, criticalIssues.length, context);

    return {
      overallScore,
      raceReady,
      zoneScores: zoneScores as Record<SailZone, number>,
      criticalIssues,
      allIssues,
      prioritizedRecommendations: recommendations,
      estimatedRemainingLife: remainingLife,
      nextInspectionRecommendation: nextInspection,
      summary,
    };
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  static async convertImageToBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  }

  private static generatePrioritizedRecommendations(
    issues: DetectedIssue[],
    overallScore: number
  ): OverallSailAssessment['prioritizedRecommendations'] {
    const recommendations: OverallSailAssessment['prioritizedRecommendations'] = [];

    // Critical/severe issues first
    for (const issue of issues.filter(i => i.severity === 'critical')) {
      recommendations.push({
        priority: 'high',
        action: `Immediately address: ${issue.description}`,
        reasoning: 'Critical issue - sail should not be used until resolved',
        estimatedCost: 'Consult sailmaker',
      });
    }

    for (const issue of issues.filter(i => i.severity === 'severe')) {
      recommendations.push({
        priority: 'high',
        action: `Repair before next race: ${issue.description}`,
        reasoning: 'Severe issue may worsen or affect safety',
        estimatedCost: 'Professional repair recommended',
      });
    }

    // Moderate issues
    for (const issue of issues.filter(i => i.severity === 'moderate')) {
      recommendations.push({
        priority: 'medium',
        action: `Schedule repair: ${issue.description}`,
        reasoning: 'May affect performance or worsen over time',
      });
    }

    // General recommendations based on score
    if (overallScore < 70) {
      recommendations.push({
        priority: 'medium',
        action: 'Consider professional sail survey',
        reasoning: 'Overall condition warrants expert assessment',
      });
    }

    return recommendations.slice(0, 5); // Max 5 recommendations
  }

  private static estimateRemainingLife(
    score: number,
    context?: SailContext
  ): string {
    if (score >= 90) return 'Excellent - 2+ seasons of racing remaining';
    if (score >= 80) return 'Good - 1-2 seasons of competitive racing';
    if (score >= 70) return 'Fair - 1 season, consider replacement planning';
    if (score >= 60) return 'Limited - finish this season, plan replacement';
    return 'End of life - replacement recommended';
  }

  private static recommendNextInspection(
    score: number,
    issues: DetectedIssue[]
  ): string {
    const hasSevereIssues = issues.some(i => i.severity === 'severe' || i.severity === 'critical');

    if (hasSevereIssues) return 'Inspect after any repairs are completed';
    if (score >= 90) return 'Standard inspection in 30 days or after 10 races';
    if (score >= 80) return 'Inspect in 14 days or after 5 races';
    if (score >= 70) return 'Inspect before each race weekend';
    return 'Inspect before every use';
  }

  private static generateSummary(
    score: number,
    raceReady: boolean,
    criticalCount: number,
    context?: SailContext
  ): string {
    const sailType = context?.sailType || 'sail';
    const age = context?.ageMonths ? `${Math.round(context.ageMonths / 12)} year old ` : '';

    if (!raceReady) {
      return `This ${age}${sailType} has ${criticalCount} critical issue(s) that must be addressed before racing. Score: ${score}/100.`;
    }

    if (score >= 85) {
      return `This ${age}${sailType} is in excellent condition (${score}/100) and race ready. Continue regular maintenance.`;
    }

    if (score >= 70) {
      return `This ${age}${sailType} is in good condition (${score}/100) and race ready, with some minor issues to monitor.`;
    }

    return `This ${age}${sailType} is serviceable (${score}/100) but showing wear. Consider repair or replacement planning.`;
  }

  // =============================================================================
  // Fallback Methods
  // =============================================================================

  private static generateFallbackZoneResult(zone: SailZone, startTime: number): ZoneAnalysisResult {
    return {
      zone,
      conditionScore: 70,
      issues: [{
        type: 'uv_damage',
        severity: 'minor',
        description: 'Unable to analyze - manual inspection recommended',
        confidence: 0,
      }],
      recommendations: ['Manual visual inspection recommended'],
      raceReady: true,
      aiNotes: 'AI analysis unavailable - default assessment applied',
      confidence: 0,
      processingTimeMs: Date.now() - startTime,
    };
  }

  private static generateFallbackQuickResult(): QuickInspectionResult {
    return {
      overallScore: 70,
      raceReady: true,
      estimatedZoneScores: {
        head: 70,
        leech: 70,
        foot: 70,
        luff: 70,
        battens: 70,
        cloth: 70,
        overview: 70,
        detail: 70,
      },
      visibleIssues: [],
      recommendations: ['AI analysis unavailable - manual inspection recommended'],
      confidenceNote: 'Fallback assessment - detailed inspection strongly recommended',
    };
  }
}

export default SailAnalysisAIService;
