/**
 * Claude Skills Management Service
 * Handles uploading, listing, and managing custom Claude Skills for the application
 *
 * Features:
 * - Upload custom skills to Anthropic
 * - List and retrieve skill metadata
 * - Cache skill IDs for performance
 * - Automatic skill initialization on app startup
 */

import Anthropic from '@anthropic-ai/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  uploadedAt: Date;
  source: 'anthropic' | 'custom';
}

export class SkillManagementService {
  private anthropic: Anthropic;
  private skillCache: Map<string, SkillMetadata> = new Map();
  private readonly CACHE_KEY = '@regattaflow:claude_skills_cache';
  private readonly SKILL_DEFINITIONS_PATH = '../../../skills/';
  private initialized = false;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {

    }

    this.anthropic = new Anthropic({
      apiKey: apiKey || 'placeholder',
      dangerouslyAllowBrowser: true // Development only - move to backend for production
    });

    // Don't load cache on construction - do it lazily
  }

  /**
   * Initialize the service (lazy initialization to avoid web compatibility issues)
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    // Only use AsyncStorage on native platforms
    if (Platform.OS !== 'web') {
      await this.loadCachedSkills();
    }

    this.initialized = true;
  }

  /**
   * Upload a custom skill to Anthropic
   * @param name Skill name (e.g., 'race-strategy-analyst')
   * @param description Brief description of the skill
   * @param content Skill content (markdown/text defining the skill's expertise)
   * @returns Skill ID if successful
   */
  async uploadSkill(
    name: string,
    description: string,
    content: string
  ): Promise<string | null> {
    await this.ensureInitialized();

    try {

      // Create a File object from the content
      // API requires the file to be named "SKILL.md" and be in top-level folder
      const blob = new Blob([content], { type: 'text/markdown' });
      const file = new File([blob], 'SKILL.md', { type: 'text/markdown' });

      // Set the webkitRelativePath to indicate it's in the top-level folder
      Object.defineProperty(file, 'webkitRelativePath', {
        writable: true,
        value: 'SKILL.md'
      });

      // Call Anthropic Skills API to upload
      // Note: This uses the beta skills API endpoint
      const response = await this.anthropic.beta.skills.create({
        name,
        description,
        files: [file],
        betas: ['skills-2025-10-02']
      } as any); // Type assertion due to beta API

      const skillId = (response as any).id;

      if (skillId) {
        // Cache the skill metadata
        const metadata: SkillMetadata = {
          id: skillId,
          name,
          description,
          version: 'latest',
          uploadedAt: new Date(),
          source: 'custom'
        };

        this.skillCache.set(name, metadata);
        await this.saveCachedSkills();

        return skillId;
      }

      return null;
    } catch (error) {

      // If skill already exists, try to retrieve it
      if ((error as any)?.message?.includes('already exists')) {
        return await this.getSkillId(name);
      }

      return null;
    }
  }

  /**
   * List all available skills (both Anthropic and custom)
   */
  async listSkills(): Promise<SkillMetadata[]> {
    await this.ensureInitialized();

    try {

      const response = await this.anthropic.beta.skills.list({
        betas: ['skills-2025-10-02']
      } as any);

      const skills = (response as any).data || [];

      // Update cache with latest skills
      skills.forEach((skill: any) => {
        const metadata: SkillMetadata = {
          id: skill.id,
          name: skill.name,
          description: skill.description || '',
          version: skill.version || 'latest',
          uploadedAt: new Date(skill.created_at),
          source: skill.type === 'anthropic' ? 'anthropic' : 'custom'
        };
        this.skillCache.set(skill.name, metadata);
      });

      await this.saveCachedSkills();

      // Log skill names for debugging
      if (skills.length > 0) {
        const skillNames = skills.map((s: any) => s.name).join(', ');
      }

      return Array.from(this.skillCache.values());
    } catch (error) {

      // Return cached skills as fallback
      return Array.from(this.skillCache.values());
    }
  }

  /**
   * Get skill ID by name from cache or API
   */
  async getSkillId(name: string): Promise<string | null> {
    await this.ensureInitialized();

    // Check cache first
    const cached = this.skillCache.get(name);
    if (cached) {
      return cached.id;
    }

    // Fetch from API
    const skills = await this.listSkills();
    const skill = skills.find(s => s.name === name);
    return skill?.id || null;
  }

  /**
   * Initialize race-strategy-analyst skill
   * Uploads if not exists, returns skill ID
   */
  async initializeRaceStrategySkill(): Promise<string | null> {
    await this.ensureInitialized();

    try {

      // List all skills to see what's available
      const allSkills = await this.listSkills();

      // Check for various possible names for the race strategy skill
      const possibleNames = [
        'race-strategy-analyst',
        'race-strategy',
        'sailing-strategy',
        'regatta-strategy',
        'tactical-racing'
      ];

      for (const name of possibleNames) {
        const skillId = await this.getSkillId(name);
        if (skillId) {
          return skillId;
        }
      }

      // Load skill content from file
      const skillContent = await this.loadSkillContent('race-strategy-analyst');
      if (!skillContent) {

        return null;
      }

      // Upload the skill
      const skillId = await this.uploadSkill(
        'race-strategy-analyst',
        'Expert sailing race strategist combining Bill Gladstone and Steve Colgate frameworks with championship execution techniques',
        skillContent
      );

      if (skillId) {
      }

      return skillId;
    } catch (error) {

      return null;
    }
  }

  /**
   * Load skill content from markdown file
   * Note: In production, this should be bundled or loaded from backend
   */
  private async loadSkillContent(skillName: string): Promise<string | null> {
    try {
      // For development, we'll use the skill content directly
      // In production, this would be loaded from bundled assets or backend

      // This is a placeholder - actual implementation depends on how you bundle the skill files
      // For now, we'll return a condensed version that can be embedded

      const raceStrategyContent = `# Race Strategy Analyst

Expert sailing race strategist with championship tactics expertise.

## Core Knowledge
- Shift mathematics & wind strategy (oscillating shifts, lift/header response)
- Starting techniques (line bias, time-distance-speed, acceleration zones)
- Upwind tactics (layline discipline, current integration, fleet positioning)
- Mark rounding excellence (wide entry/tight exit, traffic management)
- Downwind strategy (VMG optimization, shift detection, wave riding)
- Covering & split distance (loose cover, Gladstone's 1/3 rule)
- Current & tidal strategy (timing legs, lee-bow technique)
- Championship execution (risk management, consistency, psychology)

## Output Requirements
Always provide: THEORY (quantified framework), EXECUTION (step-by-step how), CONFIDENCE (0-100%), CHAMPION STORY (when relevant)

## Key Principles
1. Speed First - never sacrifice boat speed unless covering
2. Clear Air - worth 5-10 boat lengths advantage
3. Tack on Headers - immediate response to >5° headers
4. Minimize Tacks - each costs 2-3 boat lengths
5. Laylines are Defensive - approach late with options
6. Current > Wind - in tidal areas, current outweighs shifts
7. Conservative = Consistent - series racing rewards top-third finishes

Expert frameworks from Bill Gladstone, Steve Colgate, Hans Fogh, Bill Cox.`;

      return raceStrategyContent;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load cached skills from AsyncStorage
   */
  private async loadCachedSkills(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const skills = JSON.parse(cached) as SkillMetadata[];
        skills.forEach(skill => {
          // Reconstruct Date objects
          skill.uploadedAt = new Date(skill.uploadedAt);
          this.skillCache.set(skill.name, skill);
        });
      }
    } catch (error) {

    }
  }

  /**
   * Save skills cache to AsyncStorage
   */
  private async saveCachedSkills(): Promise<void> {
    // Skip on web platform
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const skills = Array.from(this.skillCache.values());
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(skills));
    } catch (error) {

    }
  }

  /**
   * Clear skills cache (useful for debugging)
   */
  async clearCache(): Promise<void> {
    this.skillCache.clear();

    // Skip AsyncStorage on web
    if (Platform.OS !== 'web') {
      await AsyncStorage.removeItem(this.CACHE_KEY);
    }

  }
}

// Export singleton instance
export const skillManagementService = new SkillManagementService();
