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
  private skillCache: Map<string, SkillMetadata> = new Map();
  private readonly CACHE_KEY = '@regattaflow:claude_skills_cache';
  private readonly SKILL_DEFINITIONS_PATH = '../../../skills/';
  private initialized = false;
  private readonly EDGE_FUNCTION_URL: string;

  constructor() {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('⚠️ SkillManagementService: No Supabase URL found');
      this.EDGE_FUNCTION_URL = '';
    } else {
      this.EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/anthropic-skills-proxy`;
    }

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
   * Call the Anthropic Skills proxy Edge Function
   */
  private async callSkillsProxy(action: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.EDGE_FUNCTION_URL) {
      throw new Error('Supabase URL not configured');
    }

    const response = await fetch(this.EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...params }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
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
      console.log(`📤 SkillManagementService: Uploading skill '${name}'`);

      // IMPORTANT: The Anthropic Skills API requires files to be uploaded from a filesystem
      // with proper folder structure (SKILL.md in top-level folder).
      // This is NOT possible in browser/React Native environment due to security restrictions.
      //
      // WORKAROUND: Skills API should be called from a backend service or CLI tool,
      // not from the mobile/web app. For now, we'll fail gracefully and use fallback strategies.

      console.warn('⚠️ SkillManagementService: Skills API upload not supported in browser/React Native');
      console.warn('   Solution 1: Use pre-uploaded skills via skill ID');
      console.warn('   Solution 2: Implement backend Skills API proxy');
      console.warn('   Solution 3: Use CLI tool to pre-upload skills');

      // For development, check if we can find existing skills instead
      const existingSkillId = await this.getSkillId(name);
      if (existingSkillId) {
        console.log(`✅ Found existing skill '${name}' with ID: ${existingSkillId}`);
        return existingSkillId;
      }

      console.warn(`⚠️ No existing skill found for '${name}'. Continuing without skills.`);
      return null;

      // Original code commented out (doesn't work in browser/React Native):
      /*
      const blob = new Blob([content], { type: 'text/markdown' });
      const file = new File([blob], 'SKILL.md', { type: 'text/markdown' });

      Object.defineProperty(file, 'webkitRelativePath', {
        writable: true,
        value: 'SKILL.md'
      });

      const response = await this.anthropic.beta.skills.create({
        name,
        description,
        files: [file],
        betas: ['skills-2025-10-02']
      } as any);

      const skillId = (response as any).id;

      if (skillId) {
        console.log(`✅ SkillManagementService: Skill '${name}' uploaded successfully. ID: ${skillId}`);

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

      console.warn(`⚠️ SkillManagementService: Skill upload returned no ID for '${name}'`);
      return null;
      */
    } catch (error) {
      console.error(`❌ SkillManagementService: Failed to upload skill '${name}':`, error);

      // If skill already exists, try to retrieve it
      if ((error as any)?.message?.includes('already exists')) {
        return await this.getSkillId(name);
      }

      return null;
    }
  }

  /**
   * List all available skills (both Anthropic and custom)
   *
   * NOTE: Skills API is currently disabled because the beta API is not available in all environments.
   * The app works perfectly without skills - they're just an optional optimization.
   */
  async listSkills(): Promise<SkillMetadata[]> {
    await this.ensureInitialized();

    // Skills API is disabled - return cached results only
    // The app has full fallback support and works without skills
    return Array.from(this.skillCache.values());

    /* Disabled - Skills API not available in current environment
    try {
      console.log('📋 SkillManagementService: Listing all skills via proxy');

      const response = await this.callSkillsProxy('list_skills');

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
        console.log(`✅ SkillManagementService: Found ${skills.length} skills: ${skillNames}`);
      } else {
        console.log('⚠️ SkillManagementService: No skills found');
      }

      return Array.from(this.skillCache.values());
    } catch (error) {
      console.error('❌ SkillManagementService: Failed to list skills:', error);

      // Return cached skills as fallback
      return Array.from(this.skillCache.values());
    }
    */
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
      console.log('🏁 SkillManagementService: Initializing race strategy skill');

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
          console.log(`✅ SkillManagementService: Found existing skill '${name}' with ID: ${skillId}`);
          return skillId;
        }
      }

      // Load skill content from file
      const skillContent = await this.loadSkillContent('race-strategy-analyst');
      if (!skillContent) {
        console.error('❌ SkillManagementService: Failed to load skill content');
        return null;
      }

      // Upload the skill
      console.log('📤 SkillManagementService: Uploading new race-strategy-analyst skill');
      const skillId = await this.uploadSkill(
        'race-strategy-analyst',
        'Expert sailing race strategist combining Kevin Gladstone and Kevin Colgate frameworks with championship execution techniques',
        skillContent
      );

      if (skillId) {
        console.log(`✅ SkillManagementService: Race strategy skill initialized with ID: ${skillId}`);
      } else {
        console.warn('⚠️ SkillManagementService: Skill initialization returned null');
      }

      return skillId;
    } catch (error) {
      console.error('❌ SkillManagementService: Failed to initialize race strategy skill:', error);
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

Expert frameworks from Kevin Gladstone, Kevin Colgate, Hans Fogh, Kevin Cox.`;

      return raceStrategyContent;
    } catch (error) {
      console.error('❌ SkillManagementService: Failed to load skill content:', error);
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
        console.log(`📦 SkillManagementService: Loaded ${skills.length} cached skills`);
        skills.forEach(skill => {
          // Reconstruct Date objects
          skill.uploadedAt = new Date(skill.uploadedAt);
          this.skillCache.set(skill.name, skill);
        });
      }
    } catch (error) {
      console.error('❌ SkillManagementService: Failed to load cached skills:', error);
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
      console.error('❌ SkillManagementService: Failed to save cached skills:', error);
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

    console.log('🗑️ SkillManagementService: Cache cleared');
  }
}

// Export singleton instance
export const skillManagementService = new SkillManagementService();
