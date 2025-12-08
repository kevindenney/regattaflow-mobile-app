import Anthropic from '@anthropic-ai/sdk';

import { skillManagementService } from './SkillManagementService';
import { createLogger } from '@/lib/utils/logger';
import { cachedAICall } from '@/lib/utils/aiCache';
import { 
  withAIFallback, 
  generateMockRigTuning, 
  isAIInFallbackMode,
  isCreditExhaustedError,
  activateFallbackMode
} from '@/lib/utils/aiFallback';
import { BOAT_TUNING_SKILL_CONTENT } from '@/skills/tuning-guides/boatTuningSkill';
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
   * Generate AI-only recommendations without any tuning guides
   * Uses skill content as system prompt to reduce tokens (~60% savings)
   * Includes caching (10 min) and fallback when credits exhausted
   */
  async generateAIOnlyRecommendations(request: RaceTuningRequest): Promise<RaceTuningRecommendation[]> {
    logger.debug('generateAIOnlyRecommendations invoked', {
      hasValidApiKey: this.hasValidApiKey,
    });

    // Check if we're in fallback mode due to credit exhaustion
    if (isAIInFallbackMode()) {
      logger.info('Using fallback mode for rig tuning (credits exhausted)');
      const mockRec = generateMockRigTuning({
        className: request.className || request.classId,
        windSpeed: request.averageWindSpeed,
      });
      return [this.transformAIOnlyRecommendation(mockRec)];
    }

    if (!this.hasValidApiKey) {
      logger.warn('AI rig tuning unavailable: No Anthropic API key configured');
      return [];
    }

    await this.ensureSkillInitialized();

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

    // Cache key for this specific request (10 min TTL)
    const cacheKey = {
      type: 'rig-tuning',
      classId: classId || className,
      windSpeed: Math.round(averageWindSpeed || 0),
      pointsOfSail,
    };

    logger.debug('AI-only tuning request', {
      boatClass: className || classId,
      pointsOfSail,
      windSpeed: averageWindSpeed,
    });

    // Use cached response if available (saves ~$0.01-0.02 per request)
    return cachedAICall(
      cacheKey,
      async () => this.callAIForTuning(className || classId || 'Unknown', pointsOfSail, weatherContext),
      10 * 60 * 1000 // 10 minute cache
    );
  }

  /**
   * Internal method to call AI for tuning recommendations
   * Uses skill content as system prompt to reduce tokens
   */
  private async callAIForTuning(
    boatClass: string,
    pointsOfSail: string,
    weatherContext: Record<string, any>
  ): Promise<RaceTuningRecommendation[]> {
    // Minimal user prompt - skill content handles the context (saves ~60% tokens)
    const userPrompt = `Generate rig tuning for:
- Boat: ${boatClass}
- Point of Sail: ${pointsOfSail}
- Conditions: ${JSON.stringify(weatherContext)}

Return JSON array with ONE recommendation. No guides uploaded - use physics-based reasoning.`;

    logger.debug('Calling Anthropic API with skill system prompt', {
      model: 'claude-3-5-haiku-latest',
      systemPromptLength: BOAT_TUNING_SKILL_CONTENT.length,
      userPromptLength: userPrompt.length,
    });

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 2000,
        temperature: 0.5,
        // Use skill content as system prompt - reduces user prompt by ~60%
        system: BOAT_TUNING_SKILL_CONTENT,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });

      logger.debug('Anthropic API call successful', {
        id: response.id,
        model: response.model,
        stopReason: response.stop_reason,
      });

      const textBlocks = (response.content as Array<{ type: string; text?: string }>)
        .filter(block => block.type === 'text' && typeof block.text === 'string')
        .map(block => block.text!.trim())
        .filter(Boolean);

      const combinedText = textBlocks.join('\n').trim();

      if (!combinedText) {
        throw new Error('AI rig tuning returned no content');
      }

      const jsonMatch = combinedText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Unable to parse JSON from AI rig tuning response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        throw new Error('AI rig tuning response was not an array');
      }

      return parsed.map(item => this.transformAIOnlyRecommendation(item));
    } catch (error) {
      // Handle credit exhaustion gracefully
      if (isCreditExhaustedError(error)) {
        activateFallbackMode('Anthropic API credit balance too low');
        logger.warn('Activating fallback mode due to credit exhaustion');
        const mockRec = generateMockRigTuning({
          className: boatClass,
          windSpeed: weatherContext.windSpeed,
        });
        return [this.transformAIOnlyRecommendation(mockRec)];
      }
      
      logger.error('AI rig tuning generation failed', error);
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
