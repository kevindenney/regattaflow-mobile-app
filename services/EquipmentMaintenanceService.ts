/**
 * Equipment Maintenance Service
 * AI-powered maintenance guide generation and equipment care recommendations
 */

import Anthropic from '@anthropic-ai/sdk';
import { equipmentService, type BoatEquipment, type AICareGuide, type LubricationSchedule } from './EquipmentService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('EquipmentMaintenanceService');

// ============================================================================
// Types
// ============================================================================

export interface MaintenanceGuideRequest {
  equipmentType: string;
  category: string;
  manufacturer?: string;
  model?: string;
  ageYears?: number;
  currentCondition?: number;
  sailingEnvironment?: 'freshwater' | 'saltwater' | 'mixed';
  usageIntensity?: 'light' | 'moderate' | 'heavy' | 'racing';
}

export interface PreRaceCheckItem {
  item: string;
  priority: 'critical' | 'important' | 'recommended';
  category: string;
  checkType: 'visual' | 'functional' | 'measurement';
  instructions?: string;
}

export interface PreRaceChecklist {
  boatId: string;
  generatedAt: string;
  conditions: {
    windSpeed?: number;
    windDirection?: number;
  };
  criticalChecks: PreRaceCheckItem[];
  importantChecks: PreRaceCheckItem[];
  recommendedChecks: PreRaceCheckItem[];
  equipmentAlerts: {
    equipmentId: string;
    equipmentName: string;
    alertType: 'overdue' | 'due_soon' | 'poor_condition' | 'critical_priority';
    message: string;
  }[];
}

// ============================================================================
// Cache for AI-generated guides
// ============================================================================

interface CachedGuide {
  guide: AICareGuide;
  cachedAt: number;
  cacheKey: string;
}

const GUIDE_CACHE = new Map<string, CachedGuide>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getCacheKey(request: MaintenanceGuideRequest): string {
  return `${request.category}:${request.equipmentType}:${request.manufacturer || 'generic'}:${request.model || 'generic'}`;
}

// ============================================================================
// Service Class
// ============================================================================

class EquipmentMaintenanceService {
  private anthropic: Anthropic | null = null;
  private hasValidApiKey = false;

  constructor() {
    this.initializeAnthropic();
  }

  private initializeAnthropic() {
    try {
      const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
      if (apiKey) {
        this.anthropic = new Anthropic({ apiKey });
        this.hasValidApiKey = true;
        logger.debug('Anthropic client initialized for maintenance guides');
      } else {
        logger.warn('No Anthropic API key found, AI maintenance guides will be unavailable');
      }
    } catch (error) {
      logger.error('Error initializing Anthropic client', { error });
    }
  }

  /**
   * Check if AI guide generation is available
   */
  isAvailable(): boolean {
    return this.hasValidApiKey && this.anthropic !== null;
  }

  /**
   * Generate an AI-powered care guide for equipment
   */
  async generateCareGuide(request: MaintenanceGuideRequest): Promise<AICareGuide | null> {
    // Check cache first
    const cacheKey = getCacheKey(request);
    const cached = GUIDE_CACHE.get(cacheKey);
    if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL_MS) {
      logger.debug('Returning cached care guide', { cacheKey });
      return cached.guide;
    }

    if (!this.isAvailable()) {
      logger.warn('AI not available, returning generic guide');
      return this.getGenericGuide(request);
    }

    try {
      const prompt = this.buildCareGuidePrompt(request);
      
      const response = await this.anthropic!.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const guide = this.parseGuideResponse(content.text, request);
      
      // Cache the result
      GUIDE_CACHE.set(cacheKey, {
        guide,
        cachedAt: Date.now(),
        cacheKey,
      });

      return guide;
    } catch (error) {
      logger.error('Error generating care guide', { error, request });
      return this.getGenericGuide(request);
    }
  }

  /**
   * Generate care guide for specific equipment
   */
  async generateCareGuideForEquipment(equipment: BoatEquipment): Promise<AICareGuide | null> {
    const ageYears = equipment.purchase_date
      ? Math.floor((Date.now() - new Date(equipment.purchase_date).getTime()) / (365 * 24 * 60 * 60 * 1000))
      : undefined;

    return this.generateCareGuide({
      equipmentType: equipment.custom_name,
      category: equipment.category,
      manufacturer: equipment.manufacturer,
      model: equipment.model,
      ageYears,
      currentCondition: equipment.condition_rating,
      usageIntensity: 'racing', // Default assumption for regatta app
      sailingEnvironment: 'saltwater', // Default
    });
  }

  /**
   * Store AI care guide on equipment record
   */
  async generateAndStoreCareGuide(equipmentId: string): Promise<AICareGuide | null> {
    const equipment = await equipmentService.getEquipment(equipmentId);
    if (!equipment) {
      throw new Error('Equipment not found');
    }

    const guide = await this.generateCareGuideForEquipment(equipment);
    if (guide) {
      await equipmentService.storeAICareGuide(equipmentId, guide);
    }

    return guide;
  }

  /**
   * Generate pre-race equipment checklist
   */
  async generatePreRaceChecklist(
    boatId: string,
    conditions?: { windSpeed?: number; windDirection?: number }
  ): Promise<PreRaceChecklist> {
    const [equipment, healthScore] = await Promise.all([
      equipmentService.getEquipmentForBoat(boatId),
      equipmentService.getBoatEquipmentHealth(boatId),
    ]);

    const activeEquipment = equipment.filter(e => e.status === 'active');
    const alerts = await equipmentService.getEquipmentRequiringAttention(boatId);

    // Build equipment alerts
    const equipmentAlerts = alerts.map(e => {
      let alertType: 'overdue' | 'due_soon' | 'poor_condition' | 'critical_priority' = 'due_soon';
      let message = '';

      if (e.next_maintenance_date && new Date(e.next_maintenance_date) < new Date()) {
        alertType = 'overdue';
        message = `Maintenance overdue since ${new Date(e.next_maintenance_date).toLocaleDateString()}`;
      } else if (e.replacement_priority === 'critical') {
        alertType = 'critical_priority';
        message = 'Critical: Consider replacement before racing';
      } else if (e.condition_rating !== undefined && e.condition_rating < 50) {
        alertType = 'poor_condition';
        message = `Condition at ${e.condition_rating}% - inspect before racing`;
      } else if (e.next_maintenance_date) {
        message = `Service due ${new Date(e.next_maintenance_date).toLocaleDateString()}`;
      }

      return {
        equipmentId: e.id,
        equipmentName: e.custom_name,
        alertType,
        message,
      };
    });

    // Generate checks based on equipment
    const criticalChecks: PreRaceCheckItem[] = [];
    const importantChecks: PreRaceCheckItem[] = [];
    const recommendedChecks: PreRaceCheckItem[] = [];

    // Standing rigging checks
    const hasShrouds = activeEquipment.some(e => e.category === 'shrouds');
    const hasForestay = activeEquipment.some(e => e.category === 'forestay');
    const hasBackstay = activeEquipment.some(e => e.category === 'backstay');

    if (hasShrouds || hasForestay || hasBackstay) {
      criticalChecks.push({
        item: 'Standing rigging visual inspection',
        priority: 'critical',
        category: 'standing_rigging',
        checkType: 'visual',
        instructions: 'Check all wire/rod for broken strands, corrosion, or damage at swages and tangs',
      });
      importantChecks.push({
        item: 'Shroud tension check',
        priority: 'important',
        category: 'standing_rigging',
        checkType: 'functional',
        instructions: 'Verify tension is consistent and appropriate for conditions',
      });
    }

    // Sail checks
    const sails = activeEquipment.filter(e => ['mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero'].includes(e.category));
    if (sails.length > 0) {
      criticalChecks.push({
        item: 'Sail attachment points',
        priority: 'critical',
        category: 'sails',
        checkType: 'visual',
        instructions: 'Check head, tack, and clew attachments for wear',
      });
      importantChecks.push({
        item: 'Batten pockets and battens',
        priority: 'important',
        category: 'sails',
        checkType: 'visual',
        instructions: 'Ensure all battens present and secured',
      });
    }

    // Running rigging
    const hasSheets = activeEquipment.some(e => e.category === 'sheets');
    const hasHalyards = activeEquipment.some(e => e.category === 'halyards');
    if (hasSheets || hasHalyards) {
      criticalChecks.push({
        item: 'Halyard and sheet condition',
        priority: 'critical',
        category: 'running_rigging',
        checkType: 'visual',
        instructions: 'Check for chafe, UV damage, and secure splices',
      });
    }

    // Deck hardware
    const hasWinches = activeEquipment.some(e => e.category === 'winches');
    if (hasWinches) {
      importantChecks.push({
        item: 'Winch function test',
        priority: 'important',
        category: 'hardware',
        checkType: 'functional',
        instructions: 'Test all winches for smooth operation in both directions',
      });
    }

    // Safety equipment
    const hasSafetyGear = activeEquipment.some(e => ['life_jackets', 'safety_gear'].includes(e.category));
    if (hasSafetyGear) {
      criticalChecks.push({
        item: 'PFDs and safety gear',
        priority: 'critical',
        category: 'safety',
        checkType: 'visual',
        instructions: 'Verify PFDs for all crew, check expiration dates',
      });
    }

    // Steering
    const hasSteering = activeEquipment.some(e => ['tiller', 'wheel', 'rudder'].includes(e.category));
    if (hasSteering) {
      criticalChecks.push({
        item: 'Steering system',
        priority: 'critical',
        category: 'steering',
        checkType: 'functional',
        instructions: 'Check full range of motion, verify no play or binding',
      });
    }

    // Electronics
    const hasInstruments = activeEquipment.some(e => ['instruments', 'gps', 'compass'].includes(e.category));
    if (hasInstruments) {
      recommendedChecks.push({
        item: 'Instruments power-on test',
        priority: 'recommended',
        category: 'electronics',
        checkType: 'functional',
        instructions: 'Verify wind, speed, and depth instruments are reading correctly',
      });
    }

    // Wind-specific checks
    if (conditions?.windSpeed && conditions.windSpeed > 15) {
      importantChecks.push({
        item: 'Heavy weather sail selection',
        priority: 'important',
        category: 'sails',
        checkType: 'visual',
        instructions: 'Verify heavy air sails are accessible and in good condition',
      });
      importantChecks.push({
        item: 'Reef lines',
        priority: 'important',
        category: 'running_rigging',
        checkType: 'functional',
        instructions: 'Test reefing system for smooth operation',
      });
    }

    return {
      boatId,
      generatedAt: new Date().toISOString(),
      conditions: conditions || {},
      criticalChecks,
      importantChecks,
      recommendedChecks,
      equipmentAlerts,
    };
  }

  /**
   * Get maintenance recommendations for upcoming race
   */
  async getPreRaceMaintenanceRecommendations(
    boatId: string,
    raceDaysAway: number = 7
  ): Promise<string[]> {
    const alerts = await equipmentService.getEquipmentRequiringAttention(boatId);
    const recommendations: string[] = [];

    for (const equipment of alerts) {
      if (equipment.next_maintenance_date) {
        const dueDate = new Date(equipment.next_maintenance_date);
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilDue < 0) {
          recommendations.push(
            `🔴 ${equipment.custom_name} maintenance is ${Math.abs(daysUntilDue)} days overdue - service before racing`
          );
        } else if (daysUntilDue < raceDaysAway) {
          recommendations.push(
            `🟡 ${equipment.custom_name} maintenance due in ${daysUntilDue} days - consider servicing before race`
          );
        }
      }

      if (equipment.condition_rating !== undefined && equipment.condition_rating < 60) {
        recommendations.push(
          `⚠️ ${equipment.custom_name} condition is ${equipment.condition_rating}% - inspect and address issues`
        );
      }

      if (equipment.replacement_priority === 'critical') {
        recommendations.push(
          `🚨 ${equipment.custom_name} is marked critical priority - replacement recommended`
        );
      }
    }

    return recommendations;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private buildCareGuidePrompt(request: MaintenanceGuideRequest): string {
    const context = [
      `Equipment: ${request.equipmentType}`,
      `Category: ${request.category}`,
      request.manufacturer ? `Manufacturer: ${request.manufacturer}` : null,
      request.model ? `Model: ${request.model}` : null,
      request.ageYears ? `Age: ${request.ageYears} years` : null,
      request.currentCondition ? `Current condition: ${request.currentCondition}%` : null,
      request.sailingEnvironment ? `Environment: ${request.sailingEnvironment}` : null,
      request.usageIntensity ? `Usage intensity: ${request.usageIntensity}` : null,
    ].filter(Boolean).join('\n');

    return `You are an expert marine equipment technician specializing in racing sailboat maintenance. Generate a comprehensive care guide for the following equipment:

${context}

Provide a JSON response with the following structure:
{
  "equipment_type": "string",
  "manufacturer": "string or null",
  "model": "string or null",
  "lubrication_schedule": [
    {
      "interval": "e.g., 'every 50 hours' or 'monthly' or 'annually'",
      "type": "specific lubricant recommendation",
      "instructions": "step-by-step lubrication process",
      "parts": ["list of specific parts to lubricate"]
    }
  ],
  "inspection_checklist": ["list of items to inspect regularly"],
  "cleaning_instructions": "detailed cleaning procedure",
  "storage_recommendations": "how to store when not in use",
  "warning_signs": ["signs of wear or damage to watch for"],
  "performance_tips": ["tips for optimal performance"],
  "common_issues": ["common problems and solutions"]
}

Focus on:
1. Racing sailboat-specific considerations
2. Saltwater environment protection
3. Performance optimization
4. Safety-critical items
5. Manufacturer-specific recommendations if known

Return ONLY valid JSON, no additional text.`;
  }

  private parseGuideResponse(responseText: string, request: MaintenanceGuideRequest): AICareGuide {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        generated_at: new Date().toISOString(),
        equipment_type: parsed.equipment_type || request.equipmentType,
        manufacturer: parsed.manufacturer || request.manufacturer,
        model: parsed.model || request.model,
        lubrication_schedule: parsed.lubrication_schedule || [],
        inspection_checklist: parsed.inspection_checklist || [],
        cleaning_instructions: parsed.cleaning_instructions || '',
        storage_recommendations: parsed.storage_recommendations || '',
        warning_signs: parsed.warning_signs || [],
        performance_tips: parsed.performance_tips || [],
        common_issues: parsed.common_issues || [],
      };
    } catch (error) {
      logger.error('Error parsing AI response', { error, responseText });
      return this.getGenericGuide(request);
    }
  }

  private getGenericGuide(request: MaintenanceGuideRequest): AICareGuide {
    const guides: Record<string, Partial<AICareGuide>> = {
      winches: {
        lubrication_schedule: [
          { interval: 'Every 3 months or 100 hours', type: 'Winch grease (Harken, Lewmar)', instructions: 'Disassemble, clean, grease pawls and bearings', parts: ['pawls', 'bearings', 'gears'] },
        ],
        inspection_checklist: ['Pawl springs', 'Drum surface', 'Base mount bolts', 'Handle socket'],
        cleaning_instructions: 'Flush with fresh water after each sail. Quarterly deep clean with degreaser.',
        warning_signs: ['Clicking sounds', 'Stiff operation', 'Slipping under load'],
      },
      shrouds: {
        lubrication_schedule: [
          { interval: 'Annually', type: 'Lanolin or Boeshield', instructions: 'Apply to swages and toggles', parts: ['swages', 'toggles', 'turnbuckles'] },
        ],
        inspection_checklist: ['Wire for broken strands', 'Swage integrity', 'Toggle pins', 'Cotter pins', 'Turnbuckle threads'],
        cleaning_instructions: 'Wipe with fresh water cloth. Annual inspection at professional rigger.',
        warning_signs: ['Meat hooks (broken wires)', 'Corrosion at swages', 'Cracks in fittings'],
      },
      mainsail: {
        inspection_checklist: ['Stitching at stress points', 'Batten pockets', 'Headboard', 'Clew and tack rings', 'Bolt rope'],
        cleaning_instructions: 'Rinse with fresh water. Mild soap for stains. Never fold wet.',
        storage_recommendations: 'Store dry, loosely rolled or flaked. Avoid UV exposure.',
        warning_signs: ['Stretched luff', 'UV degradation', 'Chafe marks', 'Delamination'],
      },
      blocks: {
        lubrication_schedule: [
          { interval: 'Monthly during season', type: 'McLube or dry lubricant', instructions: 'Apply to sheave bearing', parts: ['sheave', 'cheek plates'] },
        ],
        inspection_checklist: ['Sheave for wear grooves', 'Side plates for cracks', 'Becket attachment', 'Load rating'],
        cleaning_instructions: 'Rinse after sailing. Spray lubricant periodically.',
        warning_signs: ['Squeaking', 'Rough rotation', 'Side play in sheave'],
      },
    };

    const categoryGuide = guides[request.category] || {};

    return {
      generated_at: new Date().toISOString(),
      equipment_type: request.equipmentType,
      manufacturer: request.manufacturer,
      model: request.model,
      lubrication_schedule: categoryGuide.lubrication_schedule || [],
      inspection_checklist: categoryGuide.inspection_checklist || ['Visual inspection for damage', 'Check all fasteners', 'Test function'],
      cleaning_instructions: categoryGuide.cleaning_instructions || 'Rinse with fresh water after each use. Clean with mild soap as needed.',
      storage_recommendations: categoryGuide.storage_recommendations || 'Store in dry, ventilated area away from UV light.',
      warning_signs: categoryGuide.warning_signs || ['Visible damage', 'Unusual sounds', 'Reduced performance'],
      performance_tips: categoryGuide.performance_tips || ['Regular inspection', 'Prompt repairs', 'Quality replacements'],
      common_issues: categoryGuide.common_issues || [],
    };
  }
}

// Export singleton instance
export const equipmentMaintenanceService = new EquipmentMaintenanceService();
export default equipmentMaintenanceService;

