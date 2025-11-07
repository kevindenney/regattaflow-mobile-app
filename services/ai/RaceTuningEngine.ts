import Anthropic from '@anthropic-ai/sdk';

import { skillManagementService } from './SkillManagementService';
import { createLogger } from '@/lib/utils/logger';
import type {
  RaceTuningRequest,
  RaceTuningRecommendation,
  RaceTuningSetting
} from '@/services/RaceTuningService';
import { resolveAnthropicApiKey } from '@/lib/config/anthropic';
import type { ExtractedSection } from '@/services/TuningGuideExtractionService';

const logger = createLogger('RaceTuningEngine');

interface CandidateGuideInfo {
  id: string;
  title: string;
  source: string;
  year?: number | null;
  tags?: string[];
  rig?: string | null;
  mast?: string | null;
  sailmaker?: string | null;
  hull?: string | null;
}

export interface RaceTuningCandidate {
  guide: CandidateGuideInfo;
  section: Pick<ExtractedSection, 'title' | 'content' | 'conditions'> & {
    settings: Record<string, string>;
  };
  score: number;
}

interface GenerateParams extends RaceTuningRequest {
  candidates: RaceTuningCandidate[];
}

interface SkillSetting {
  key?: string;
  rawKey?: string;
  label?: string;
  value?: string;
}

interface SkillRecommendation {
  guideId?: string;
  guideTitle?: string;
  guideSource?: string;
  sectionTitle?: string;
  conditionSummary?: string;
  notes?: string | string[];
  settings?: SkillSetting[];
  tags?: string[];
  confidence?: number;
  matchScore?: number;
  caveats?: string[];
}

class RaceTuningEngine {
  private anthropic: Anthropic;
  private hasValidApiKey = false;
  private customSkillId: string | null = null;
  private skillInitialized = false;
  private skillInitializationPromise: Promise<void> | null = null;

  constructor() {
    const resolvedApiKey = resolveAnthropicApiKey();

    this.hasValidApiKey = Boolean(resolvedApiKey);

    if (!this.hasValidApiKey) {
      logger.debug('Boat tuning engine running in fallback mode (no Anthropic API key configured)');
    } else {
      logger.debug('Boat tuning engine ready with Anthropic API key');
    }

    this.anthropic = new Anthropic({
      apiKey: resolvedApiKey || 'placeholder',
      dangerouslyAllowBrowser: true
    });

    if (this.hasValidApiKey) {
      void this.ensureSkillInitialized();
    }
  }

  isAvailable(): boolean {
    return this.hasValidApiKey;
  }

  isSkillReady(): boolean {
    return this.skillInitialized;
  }

  /**
   * NEW: Generate AI-only recommendations without any tuning guides
   */
  async generateAIOnlyRecommendations(request: RaceTuningRequest): Promise<RaceTuningRecommendation[]> {
    console.log('╔═════════════════════════════════════════════════════╗');
    console.log('║ RaceTuningEngine.generateAIOnlyRecommendations     ║');
    console.log('╚═════════════════════════════════════════════════════╝');

    console.log('[RaceTuningEngine] 🔑 hasValidApiKey:', this.hasValidApiKey);

    if (!this.hasValidApiKey) {
      console.error('[RaceTuningEngine] ❌ NO API KEY - Returning empty array');
      logger.warn('AI rig tuning unavailable: No Anthropic API key configured');
      return [];
    }

    console.log('[RaceTuningEngine] ✅ API key is valid');
    console.log('[RaceTuningEngine] 🔄 Ensuring skill initialized...');

    logger.debug('Starting AI-only rig tuning generation');
    await this.ensureSkillInitialized();

    console.log('[RaceTuningEngine] ✅ Skill initialization complete');

    const {
      classId,
      className,
      averageWindSpeed,
      windMin,
      windMax,
      windDirection,
      gusts,
      waveHeight,
      currentSpeed,
      currentDirection,
      pointsOfSail = 'all',
      limit = 1
    } = request;

    const weatherContext = {
      windSpeed: averageWindSpeed,
      windMin,
      windMax,
      windDirection,
      gusts,
      waveHeight,
      currentSpeed,
      currentDirection
    };

    console.log('[RaceTuningEngine] 📊 Weather Context:', weatherContext);
    console.log('[RaceTuningEngine] 🏆 Boat Class:', className || classId);
    console.log('[RaceTuningEngine] 🧭 Point of Sail:', pointsOfSail);

    const instruction = `You are the Rig Tuning Analyst skill with deep expertise in boat-specific sail trim and rig setup.

IMPORTANT: NO uploaded tuning guide exists for this boat class. Generate physics-based, intelligent rig tuning recommendations using your sailing knowledge.

Boat Class: ${className || classId || 'Unknown'}
Point of Sail: ${pointsOfSail}
Weather Forecast: ${JSON.stringify(weatherContext, null, 2)}

Return a JSON array with ONE recommendation object:
{
  "source": "ai-generated",
  "className": "${className || classId}",
  "confidence": 0.7,
  "isAIGenerated": true,
  "guideTitle": "AI Rig Tuning Analysis",
  "guideSource": "RegattaFlow AI Rig Tuning Analyst",
  "sectionTitle": "Race Day Setup for [conditions]",
  "conditionSummary": "Brief summary of weather conditions",
  "settings": [
    {
      "key": "shrouds",
      "label": "Shroud Tension",
      "value": "Specific recommendation with units",
      "reasoning": "Why this setting for these conditions"
    },
    {
      "key": "forestay",
      "label": "Forestay",
      "value": "Specific recommendation",
      "reasoning": "Brief explanation"
    },
    {
      "key": "backstay",
      "label": "Backstay",
      "value": "Usage guidance",
      "reasoning": "Tactical notes"
    },
    {
      "key": "vang",
      "label": "Vang",
      "value": "Setup guidance",
      "reasoning": "Point of sail specific"
    },
    {
      "key": "outhaul",
      "label": "Outhaul",
      "value": "Position guidance",
      "reasoning": "Depth control reasoning"
    }
  ],
  "weatherSpecificNotes": [
    "Note about wave conditions impact",
    "Note about gust response",
    "Note about current/tide if relevant"
  ],
  "caveats": [
    "These are AI-generated recommendations based on class standards and physics",
    "Actual boat setup may vary based on your specific rig package and crew weight",
    "Consider uploading your boat-specific tuning guide for precise recommendations"
  ]
}

Rules:
- Base recommendations on standard sailing physics and rig tuning principles
- Use typical class settings if you have knowledge of this boat class
- Explain your reasoning for each setting
- Be honest about confidence level (typically 0.70-0.80 for AI-only)
- Include actionable settings with specific values or clear guidance
- Mention the value of uploading boat-specific guides in caveats
- Return ONLY the JSON array, no markdown or extra text

Generate the recommendation now:`;

    console.log('[RaceTuningEngine] 📡 Calling Anthropic API...');
    console.log('[RaceTuningEngine] 🎯 Model: claude-3-5-haiku-20241022');

    try {
      const response = await this.anthropic.beta.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        temperature: 0.5,
        betas: ['code-execution-2025-08-25'],
        tools: [{
          type: 'code_execution_20250825',
          name: 'code_execution'
        }],
        messages: [{
          role: 'user',
          content: instruction
        }]
      });

      console.log('[RaceTuningEngine] ✅ API call successful');
      console.log('[RaceTuningEngine] 📦 Response received:', {
        id: response.id,
        model: response.model,
        stopReason: response.stop_reason,
        contentBlocks: response.content?.length || 0
      });

      const textBlocks = (response.content as Array<{ type: string; text?: string }>)
        .filter(block => block.type === 'text' && typeof block.text === 'string')
        .map(block => block.text!.trim())
        .filter(Boolean);

      console.log('[RaceTuningEngine] 📝 Text blocks found:', textBlocks.length);

      const combinedText = textBlocks.join('\n').trim();
      console.log('[RaceTuningEngine] 📄 Combined text length:', combinedText.length);
      console.log('[RaceTuningEngine] 📄 Combined text preview:', combinedText.substring(0, 200) + '...');

      if (!combinedText) {
        console.error('[RaceTuningEngine] ❌ No content in response');
        throw new Error('AI rig tuning returned no content');
      }

      console.log('[RaceTuningEngine] 🔍 Searching for JSON array...');
      const jsonMatch = combinedText.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        console.error('[RaceTuningEngine] ❌ No JSON array found in response');
        console.error('[RaceTuningEngine] 📄 Full text:', combinedText);
        throw new Error('Unable to parse JSON from AI rig tuning response');
      }

      console.log('[RaceTuningEngine] ✅ JSON array found, parsing...');
      const parsed = JSON.parse(jsonMatch[0]);

      console.log('[RaceTuningEngine] 📊 Parsed result:', {
        isArray: Array.isArray(parsed),
        length: Array.isArray(parsed) ? parsed.length : 0,
        firstItem: Array.isArray(parsed) ? parsed[0] : null
      });

      if (!Array.isArray(parsed)) {
        console.error('[RaceTuningEngine] ❌ Parsed result is not an array');
        throw new Error('AI rig tuning response was not an array');
      }

      console.log('[RaceTuningEngine] 🔄 Transforming recommendations...');
      const recommendations = parsed.map(item => this.transformAIOnlyRecommendation(item));

      console.log('[RaceTuningEngine] ✅ Transformation complete');
      console.log('[RaceTuningEngine] 📋 Returning', recommendations.length, 'recommendation(s)');

      return recommendations;
    } catch (error) {
      console.error('╔═════════════════════════════════════════════════════╗');
      console.error('║ ANTHROPIC API ERROR                                ║');
      console.error('╚═════════════════════════════════════════════════════╝');
      console.error('[RaceTuningEngine] ❌ Error:', error);
      console.error('[RaceTuningEngine] 📋 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      logger.error('AI-only rig tuning generation failed', error);
      throw error;
    }
  }

  async generateRecommendations(params: GenerateParams): Promise<RaceTuningRecommendation[]> {
    if (!this.hasValidApiKey) {
      return [];
    }

    await this.ensureSkillInitialized();

    const { candidates, limit = 1, classId, className, averageWindSpeed, pointsOfSail } = params;
    if (!candidates || candidates.length === 0) {
      return [];
    }

    const trimmedCandidates = candidates.slice(0, Math.max(limit, 3));
    const payload = {
      request: {
        classId: classId ?? null,
        className: className ?? null,
        averageWindSpeed: averageWindSpeed ?? null,
        pointsOfSail: pointsOfSail ?? 'all',
        limit
      },
      candidates: trimmedCandidates
    };

    const instruction = `You are the Boat Tuning Analyst skill. Use the provided candidate tuning sections to build championship-ready rig settings.

Return a JSON array where each element matches:
{
  "guideId": "string (use provided candidate guide id)",
  "guideTitle": "string",
  "guideSource": "string",
  "sectionTitle": "string",
  "conditionSummary": "string",
  "notes": ["optional array of strings"],
  "settings": [
    {
      "key": "snake_case identifier",
      "rawKey": "original setting name",
      "label": "human readable label",
      "value": "exact trim value"
    }
  ],
  "tags": ["optional tags"],
  "confidence": 0-1 (optional),
  "matchScore": 0-1 (optional),
  "caveats": ["optional strings"]
}

Rules:
- Only recommend from the provided candidate sections or clearly state if no match fits.
- Preserve the units and precision from the source.
- If no suitable candidate exists, return an empty array.
- Respond with raw JSON only (no markdown, no prose).

Context:
${JSON.stringify(payload, null, 2)}`;

    try {
      const response = await this.anthropic.beta.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        temperature: 0.5,
        betas: this.customSkillId
          ? ['code-execution-2025-08-25', 'skills-2025-10-02']
          : ['code-execution-2025-08-25'],
        ...(this.customSkillId && {
          container: {
            skills: [{
              type: 'custom',
              skill_id: this.customSkillId,
              version: 'latest'
            }]
          }
        }),
        tools: [{
          type: 'code_execution_20250825',
          name: 'code_execution'
        }],
        messages: [{
          role: 'user',
          content: instruction
        }]
      });

      const textBlocks = (response.content as Array<{ type: string; text?: string }>)
        .filter(block => block.type === 'text' && typeof block.text === 'string')
        .map(block => block.text!.trim())
        .filter(Boolean);

      const combinedText = textBlocks.join('\n').trim();
      if (!combinedText) {
        throw new Error('Boat tuning skill returned no text content');
      }

      const jsonMatch = combinedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Unable to parse JSON array from boat tuning skill response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        throw new Error('Boat tuning skill response was not an array');
      }

      return parsed
        .map(item => this.transformSkillRecommendation(item))
        .filter(rec => rec.settings.length > 0);
    } catch (error) {
      logger.error('Boat tuning skill generation failed', error);
      throw error;
    }
  }

  private async ensureSkillInitialized(): Promise<void> {
    if (this.skillInitialized || !this.hasValidApiKey) {
      return;
    }

    if (this.skillInitializationPromise) {
      await this.skillInitializationPromise;
      return;
    }

    this.skillInitializationPromise = this.initializeSkill();
    try {
      await this.skillInitializationPromise;
    } finally {
      this.skillInitializationPromise = null;
    }
  }

  private async initializeSkill(): Promise<void> {
    try {
      const skillId = await skillManagementService.initializeBoatTuningSkill();
      if (skillId) {
        this.customSkillId = skillId;
        this.skillInitialized = true;
        logger.debug(`Boat tuning skill initialized: ${skillId}`);
      } else {
        logger.debug('Boat tuning skill not available, continuing without custom skill container');
      }
    } catch (error) {
      logger.error('Failed to initialize boat tuning skill', error);
    }
  }

  /**
   * NEW: Transform AI-only recommendation (includes isAIGenerated flag and extra fields)
   */
  private transformAIOnlyRecommendation(item: any): RaceTuningRecommendation {
    const guideTitle = item.guideTitle?.trim() || 'AI Rig Tuning Analysis';
    const guideSource = item.guideSource?.trim() || 'RegattaFlow AI Rig Tuning Analyst';
    const guideId = item.guideId?.trim() || 'ai-generated-tuning';

    const settings = Array.isArray(item.settings)
      ? item.settings
          .map((setting: any) => this.transformSettingWithReasoning(setting))
          .filter((setting: any): setting is RaceTuningSetting => Boolean(setting))
      : [];

    const notesArray = Array.isArray(item.notes) ? item.notes : (item.notes ? [item.notes] : []);
    const weatherNotes = Array.isArray(item.weatherSpecificNotes) ? item.weatherSpecificNotes : [];
    const caveats = Array.isArray(item.caveats) ? item.caveats : [];

    return {
      guideId,
      guideTitle,
      guideSource,
      sectionTitle: item.sectionTitle?.trim() || undefined,
      conditionSummary: item.conditionSummary?.trim() || undefined,
      notes: notesArray.length > 0 ? notesArray.join('\n') : undefined,
      settings,
      isAIGenerated: true,
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.75,
      weatherSpecificNotes: weatherNotes,
      caveats
    };
  }

  private transformSkillRecommendation(item: SkillRecommendation): RaceTuningRecommendation {
    const guideTitle = item.guideTitle?.trim() || 'Boat Tuning Recommendation';
    const guideSource = item.guideSource?.trim() || 'AI Boat Tuning Analyst';
    const guideId = item.guideId?.trim() || this.buildGuideId(guideTitle);

    const settings = Array.isArray(item.settings)
      ? item.settings
          .map(setting => this.transformSetting(setting))
          .filter((setting): setting is RaceTuningSetting => Boolean(setting))
      : [];

    const notesArray = Array.isArray(item.notes) ? item.notes : (item.notes ? [item.notes] : []);

    return {
      guideId,
      guideTitle,
      guideSource,
      sectionTitle: item.sectionTitle?.trim() || undefined,
      conditionSummary: item.conditionSummary?.trim() || undefined,
      notes: notesArray.length > 0 ? notesArray.join('\n') : undefined,
      settings
    };
  }

  /**
   * NEW: Transform setting with reasoning field for AI-only recommendations
   */
  private transformSettingWithReasoning(setting: any): RaceTuningSetting | null {
    if (!setting) return null;
    const value = typeof setting.value === 'string' ? setting.value.trim() : '';
    if (!value) return null;

    const rawKey = setting.rawKey?.trim() || setting.key?.trim() || '';
    const key = (setting.key ?? rawKey).replace(/\s+/g, '_').toLowerCase();
    const label = setting.label?.trim() || this.toTitleCase(rawKey || key);
    const reasoning = setting.reasoning?.trim() || undefined;

    if (!key) {
      return null;
    }

    return {
      key,
      rawKey: rawKey || undefined,
      label,
      value,
      reasoning
    };
  }

  private transformSetting(setting: SkillSetting): RaceTuningSetting | null {
    if (!setting) return null;
    const value = typeof setting.value === 'string' ? setting.value.trim() : '';
    if (!value) return null;

    const rawKey = setting.rawKey?.trim() || setting.key?.trim() || '';
    const key = (setting.key ?? rawKey).replace(/\s+/g, '_').toLowerCase();
    const label = setting.label?.trim() || this.toTitleCase(rawKey || key);

    if (!key) {
      return null;
    }

    return {
      key,
      rawKey: rawKey || undefined,
      label,
      value
    };
  }

  private buildGuideId(title: string): string {
    return `ai-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/-+/g, '-');
  }

  private toTitleCase(value: string): string {
    return value
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}

export const raceTuningEngine = new RaceTuningEngine();
