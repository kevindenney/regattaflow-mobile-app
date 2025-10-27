/**
 * Sailing Education Service
 * Processes yacht club educational resources and builds sailing knowledge framework
 * Designed to leverage resources like RHKYC seminars, sailing.org.hk content, etc.
 */

import type {
  StrategyInsight,
  SafetyProtocol,
  CulturalProtocol,
  EquipmentRecommendation,
  CompetitiveIntelligence
} from '@/lib/types/ai-knowledge';

export interface SailingEducationResource {
  id: string;
  source: 'yacht_club' | 'sailing_organization' | 'professional_training' | 'expert_seminar';
  organization: string; // e.g., 'RHKYC', 'sailing.org.hk', 'RYA', 'US Sailing'
  title: string;
  type: 'safety_training' | 'tactical_seminar' | 'rules_clinic' | 'results_training' | 'cultural_brief' | 'technical_training';
  content: {
    keyTopics: string[];
    safetyProtocols: SafetyProtocol[];
    tacticalInsights: StrategyInsight[];
    culturalGuidance: CulturalProtocol[];
    equipmentAdvice: EquipmentRecommendation[];
    competitiveIntelligence: CompetitiveIntelligence[];
  };
  applicableVenues: string[]; // Venue IDs where this knowledge applies
  region: 'asia-pacific' | 'europe' | 'north-america' | 'global';
  updatedAt: Date;
  credibility: 'high' | 'moderate' | 'community'; // Source credibility rating
}

export interface EducationalKnowledgeBase {
  resources: Map<string, SailingEducationResource>;
  venueSpecificInsights: Map<string, VenueEducationalInsights>;
  globalBestPractices: GlobalSailingEducation;
  lastUpdated: Date;
}

export interface VenueEducationalInsights {
  venueId: string;
  safetyStandards: SafetyProtocol[];
  racingProtocols: CulturalProtocol[];
  tacticalKnowledge: StrategyInsight[];
  equipmentStandards: EquipmentRecommendation[];
  localExpertise: CompetitiveIntelligence[];
  educationalResources: string[]; // Resource IDs
}

export interface GlobalSailingEducation {
  universalSafetyProtocols: SafetyProtocol[];
  internationalRacingEtiquette: CulturalProtocol[];
  fundamentalTactics: StrategyInsight[];
  standardEquipment: EquipmentRecommendation[];
  bestPractices: CompetitiveIntelligence[];
}

export class SailingEducationService {
  private knowledgeBase: EducationalKnowledgeBase;

  constructor() {
    this.knowledgeBase = {
      resources: new Map(),
      venueSpecificInsights: new Map(),
      globalBestPractices: this.initializeGlobalBestPractices(),
      lastUpdated: new Date(),
    };

    // Initialize with core sailing education resources
    this.initializeEducationalResources();
  }

  /**
   * Process yacht club educational content (inspired by RHKYC seminars)
   */
  async processYachtClubEducation(
    organizationName: string,
    educationalContent: {
      safetyTraining?: string[];
      tacticalSeminars?: string[];
      rulesEducation?: string[];
      resultsTraining?: string[];
      culturalGuidance?: string[];
    },
    applicableVenues: string[] = []
  ): Promise<SailingEducationResource> {

    const resourceId = `${organizationName.toLowerCase().replace(/\s+/g, '_')}_education_${Date.now()}`;

    // Extract educational insights from content
    const safetyProtocols = await this.extractSafetyProtocols(educationalContent.safetyTraining || []);
    const tacticalInsights = await this.extractTacticalInsights(educationalContent.tacticalSeminars || []);
    const culturalGuidance = await this.extractCulturalGuidance(educationalContent.culturalGuidance || []);
    const equipmentAdvice = await this.extractEquipmentAdvice(educationalContent.tacticalSeminars || []);
    const competitiveIntelligence = await this.extractCompetitiveIntelligence(
      [...(educationalContent.tacticalSeminars || []), ...(educationalContent.rulesEducation || [])]
    );

    const resource: SailingEducationResource = {
      id: resourceId,
      source: 'yacht_club',
      organization: organizationName,
      title: `${organizationName} Professional Sailing Education`,
      type: 'tactical_seminar',
      content: {
        keyTopics: this.extractKeyTopics(educationalContent),
        safetyProtocols,
        tacticalInsights,
        culturalGuidance,
        equipmentAdvice,
        competitiveIntelligence,
      },
      applicableVenues,
      region: this.determineRegion(organizationName),
      updatedAt: new Date(),
      credibility: 'high', // Yacht clubs are high-credibility sources
    };

    // Store in knowledge base
    this.knowledgeBase.resources.set(resourceId, resource);

    // Update venue-specific insights
    for (const venueId of applicableVenues) {
      await this.updateVenueInsights(venueId, resource);
    }

    return resource;
  }

  /**
   * Get educational insights for a specific venue
   */
  async getVenueEducationalInsights(venueId: string): Promise<VenueEducationalInsights | null> {
    return this.knowledgeBase.venueSpecificInsights.get(venueId) || null;
  }

  /**
   * Get enhanced sailing strategy incorporating educational insights
   */
  async getEducationallyEnhancedStrategy(
    query: string,
    venueId?: string,
    context?: any
  ): Promise<{
    insights: StrategyInsight[];
    safetyConsiderations: SafetyProtocol[];
    culturalProtocols: CulturalProtocol[];
    equipmentRecommendations: EquipmentRecommendation[];
    competitiveAdvantages: CompetitiveIntelligence[];
  }> {

    // Combine global best practices with venue-specific insights
    const globalInsights = this.knowledgeBase.globalBestPractices;
    const venueInsights = venueId ? this.knowledgeBase.venueSpecificInsights.get(venueId) : null;

    return {
      insights: [
        ...globalInsights.fundamentalTactics,
        ...(venueInsights?.tacticalKnowledge || []),
      ],
      safetyConsiderations: [
        ...globalInsights.universalSafetyProtocols,
        ...(venueInsights?.safetyStandards || []),
      ],
      culturalProtocols: [
        ...globalInsights.internationalRacingEtiquette,
        ...(venueInsights?.racingProtocols || []),
      ],
      equipmentRecommendations: [
        ...globalInsights.standardEquipment,
        ...(venueInsights?.equipmentStandards || []),
      ],
      competitiveAdvantages: [
        ...globalInsights.bestPractices,
        ...(venueInsights?.localExpertise || []),
      ],
    };
  }

  /**
   * Initialize global sailing education best practices
   */
  private initializeGlobalBestPractices(): GlobalSailingEducation {
    return {
      universalSafetyProtocols: [
        {
          type: 'offshore_preparation',
          requirement: 'Complete safety briefing and demonstrate emergency procedures knowledge',
          importance: 'mandatory',
          compliance: 'Required by international sailing organizations and yacht clubs worldwide',
        },
        {
          type: 'equipment_check',
          requirement: 'Verify all safety equipment is present, functional, and properly maintained',
          importance: 'mandatory',
          compliance: 'Standard yacht club and sailing organization requirement',
        },
        {
          type: 'weather_limits',
          requirement: 'Establish clear weather limits and abandonment criteria for racing',
          importance: 'mandatory',
          compliance: 'Professional sailing education standard',
        },
      ],
      internationalRacingEtiquette: [
        {
          situation: 'International racing participation',
          expectedBehavior: 'Respect local customs while maintaining international racing standards',
          importance: 'important',
          regionalContext: 'Universal principle for international sailing competition',
        },
        {
          situation: 'Yacht club protocol',
          expectedBehavior: 'Follow formal introductions, dress codes, and social customs',
          importance: 'important',
          regionalContext: 'Essential for building relationships in international sailing community',
        },
      ],
      fundamentalTactics: [
        {
          type: 'tactical',
          title: 'Start Line Strategy',
          description: 'Position boat for optimal start based on line bias, fleet dynamics, and conditions',
          confidence: 0.9,
          tacticalAdvice: 'Arrive at start line with clear air and boat speed, positioned for favored side',
          applicableConditions: ['All racing conditions'],
          educationalValue: 'Fundamental skill emphasized in professional sailing education',
        },
        {
          type: 'strategic',
          title: 'Risk Assessment',
          description: 'Evaluate tactical risks versus potential gains throughout the race',
          confidence: 0.9,
          tacticalAdvice: 'Consider fleet position, conditions, and race importance when making tactical decisions',
          applicableConditions: ['All racing scenarios'],
          educationalValue: 'Core principle taught in yacht club tactical seminars',
        },
      ],
      standardEquipment: [
        {
          category: 'safety',
          item: 'Personal flotation devices (PFDs)',
          reasoning: 'Mandatory safety equipment for all crew members',
          priority: 'essential',
          conditions: ['All racing conditions'],
        },
        {
          category: 'navigation',
          item: 'Depth sounder and GPS',
          reasoning: 'Essential for safe navigation and tactical positioning',
          priority: 'essential',
          conditions: ['All racing venues'],
        },
      ],
      bestPractices: [
        {
          type: 'tactical_advantage',
          insight: 'Professional sailing education emphasizes continuous learning and adaptation',
          strategicValue: 'high',
          applicability: ['All venues', 'All skill levels'],
          sources: ['Global sailing education standards'],
        },
      ],
    };
  }

  /**
   * Initialize core educational resources (based on yacht club standards)
   */
  private async initializeEducationalResources(): Promise<void> {
    // Simulate processing RHKYC-style educational content
    await this.processYachtClubEducation(
      'Royal Hong Kong Yacht Club',
      {
        safetyTraining: [
          'Offshore Racing Safety Preparation',
          'Crew Briefing Protocols',
          'Emergency Procedures',
          'Weather Assessment and Limits',
        ],
        tacticalSeminars: [
          'Harbour Secrets and Local Knowledge',
          'Dragon Class Racing Tactics',
          'Monsoon Season Sailing',
          'Commercial Traffic Management',
        ],
        rulesEducation: [
          'International Racing Rules Application',
          'Protest Procedures',
          'ORC Rating Optimization',
        ],
        resultsTraining: [
          'Results Officer Training',
          'Club Race Officer Training',
          'Scoring System Management',
        ],
        culturalGuidance: [
          'International Crew Integration',
          'Hong Kong Racing Culture',
          'Yacht Club Protocol and Etiquette',
        ],
      },
      ['hong-kong']
    );
  }

  /**
   * Extract safety protocols from educational content
   */
  private async extractSafetyProtocols(content: string[]): Promise<SafetyProtocol[]> {
    return content.map(item => ({
      type: this.categorizeItemAsSafety(item),
      requirement: item,
      importance: 'mandatory' as const,
      compliance: 'Professional sailing education standard',
    }));
  }

  /**
   * Extract tactical insights from educational content
   */
  private async extractTacticalInsights(content: string[]): Promise<StrategyInsight[]> {
    return content.map((item, index) => ({
      type: 'tactical' as const,
      title: item,
      description: `Professional tactical knowledge from yacht club educational training`,
      confidence: 0.8,
      tacticalAdvice: `Apply ${item.toLowerCase()} principles during racing`,
      applicableConditions: ['Venue-specific conditions'],
      educationalValue: 'Yacht club professional training content',
    }));
  }

  /**
   * Extract cultural guidance from educational content
   */
  private async extractCulturalGuidance(content: string[]): Promise<CulturalProtocol[]> {
    return content.map(item => ({
      situation: item,
      expectedBehavior: 'Follow yacht club educational guidelines and cultural best practices',
      importance: 'important' as const,
      regionalContext: 'Based on yacht club cultural education and protocol training',
    }));
  }

  /**
   * Extract equipment advice from educational content
   */
  private async extractEquipmentAdvice(content: string[]): Promise<EquipmentRecommendation[]> {
    return content.map(item => ({
      category: this.categorizeItemAsEquipment(item),
      item: `Equipment for ${item}`,
      reasoning: `Required for professional sailing education compliance`,
      priority: 'recommended' as const,
      conditions: ['Professional racing standards'],
    }));
  }

  /**
   * Extract competitive intelligence from educational content
   */
  private async extractCompetitiveIntelligence(content: string[]): Promise<CompetitiveIntelligence[]> {
    return content.map(item => ({
      type: 'local_knowledge' as const,
      insight: `Professional knowledge from yacht club education: ${item}`,
      strategicValue: 'high' as const,
      applicability: ['Venue-specific racing', 'Professional competition'],
      sources: ['Yacht club educational program'],
    }));
  }

  /**
   * Helper methods for content categorization
   */
  private categorizeItemAsSafety(item: string): SafetyProtocol['type'] {
    const lower = item.toLowerCase();
    if (lower.includes('offshore') || lower.includes('preparation')) return 'offshore_preparation';
    if (lower.includes('equipment') || lower.includes('check')) return 'equipment_check';
    if (lower.includes('crew') || lower.includes('briefing')) return 'crew_briefing';
    if (lower.includes('emergency') || lower.includes('procedure')) return 'emergency_procedure';
    if (lower.includes('weather') || lower.includes('limit')) return 'weather_limits';
    return 'equipment_check';
  }

  private categorizeItemAsEquipment(item: string): EquipmentRecommendation['category'] {
    const lower = item.toLowerCase();
    if (lower.includes('sail')) return 'sails';
    if (lower.includes('rigging')) return 'rigging';
    if (lower.includes('electronic') || lower.includes('navigation')) return 'electronics';
    if (lower.includes('safety')) return 'safety';
    if (lower.includes('crew')) return 'crew_gear';
    return 'navigation';
  }

  private extractKeyTopics(content: any): string[] {
    const topics = [];
    if (content.safetyTraining) topics.push(...content.safetyTraining);
    if (content.tacticalSeminars) topics.push(...content.tacticalSeminars);
    if (content.rulesEducation) topics.push(...content.rulesEducation);
    if (content.resultsTraining) topics.push(...content.resultsTraining);
    if (content.culturalGuidance) topics.push(...content.culturalGuidance);
    return topics;
  }

  private determineRegion(organizationName: string): 'asia-pacific' | 'europe' | 'north-america' | 'global' {
    const lower = organizationName.toLowerCase();
    if (lower.includes('hong kong') || lower.includes('asia') || lower.includes('pacific')) return 'asia-pacific';
    if (lower.includes('europe') || lower.includes('uk') || lower.includes('britain')) return 'europe';
    if (lower.includes('america') || lower.includes('us') || lower.includes('canada')) return 'north-america';
    return 'global';
  }

  /**
   * Update venue-specific insights with new educational resource
   */
  private async updateVenueInsights(venueId: string, resource: SailingEducationResource): Promise<void> {
    let venueInsights = this.knowledgeBase.venueSpecificInsights.get(venueId);

    if (!venueInsights) {
      venueInsights = {
        venueId,
        safetyStandards: [],
        racingProtocols: [],
        tacticalKnowledge: [],
        equipmentStandards: [],
        localExpertise: [],
        educationalResources: [],
      };
    }

    // Merge new insights
    venueInsights.safetyStandards.push(...resource.content.safetyProtocols);
    venueInsights.racingProtocols.push(...resource.content.culturalGuidance);
    venueInsights.tacticalKnowledge.push(...resource.content.tacticalInsights);
    venueInsights.equipmentStandards.push(...resource.content.equipmentAdvice);
    venueInsights.localExpertise.push(...resource.content.competitiveIntelligence);
    venueInsights.educationalResources.push(resource.id);

    this.knowledgeBase.venueSpecificInsights.set(venueId, venueInsights);
  }

  /**
   * Get knowledge base statistics
   */
  getKnowledgeBaseStats() {
    return {
      totalResources: this.knowledgeBase.resources.size,
      venuesWithInsights: this.knowledgeBase.venueSpecificInsights.size,
      lastUpdated: this.knowledgeBase.lastUpdated,
      resourceTypes: Array.from(this.knowledgeBase.resources.values()).reduce((acc, resource) => {
        acc[resource.type] = (acc[resource.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

// Export singleton instance
export const sailingEducationService = new SailingEducationService();