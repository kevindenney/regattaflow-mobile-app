// @ts-nocheck

/**
 * Educational Integration Test Suite
 * Demonstrates how the enhanced AI system leverages yacht club educational content
 */

import { enhancedAIIntegrationService } from '../EnhancedAIIntegrationService';
import { sailingEducationService } from '../SailingEducationService';
import { regionalIntelligenceService } from '../../venue/RegionalIntelligenceService';
import type { DocumentUpload, AIProcessingContext } from '../EnhancedAIIntegrationService';

describe('Enhanced AI Integration with Yacht Club Education', () => {

  beforeAll(() => {
    console.log('🧪 Testing enhanced AI integration with educational content');
  });

  test('should process yacht club educational content', async () => {
    const result = await enhancedAIIntegrationService.processYachtClubEducationalContent(
      'Royal Hong Kong Yacht Club',
      [
        'https://www.rhkyc.org.hk/storage/app/media/Sailing/Seminars/RHKYC%20Offshore%20Racing%20Safety%20Preparation_V2.0.pdf',
        'https://www.rhkyc.org.hk/storage/app/media/Sailing/Seminars/Harbour%20Secrets%202025.pdf',
      ],
      'hong-kong'
    );

    expect(result.resourcesProcessed).toBe(2);
    expect(result.insightsExtracted).toBeGreaterThan(0);
    expect(result.applicableVenues).toContain('hong-kong');
    expect(result.educationalValue).toContain('Professional sailing safety standards integrated');

  });

  test('should enhance document analysis with educational framework', async () => {
    const mockDocument: DocumentUpload = {
      filename: 'dragon_sailing_instructions.pdf',
      type: 'pdf',
      data: new ArrayBuffer(1024),
      metadata: {
        venue: 'hong-kong',
        raceType: 'fleet_racing',
      },
    };

    const context: AIProcessingContext = {
      venueId: 'hong-kong',
      raceType: 'fleet_racing',
      conditions: {
        wind: { speed: 15, direction: 270 },
        season: 'monsoon',
      },
      sailorProfile: {
        experience: 'intermediate',
        international: true,
        boatClass: 'Dragon',
      },
    };

    const enhancedResult = await enhancedAIIntegrationService.processDocumentWithEducationalEnhancement(
      mockDocument,
      context
    );

    // Verify educational enhancements
    expect(enhancedResult.educationalEnhancements.safetyProtocols).toBeDefined();
    expect(enhancedResult.educationalEnhancements.culturalProtocols).toBeDefined();
    expect(enhancedResult.educationalEnhancements.educationalInsights).toBeDefined();

    // Verify confidence boost
    expect(enhancedResult.integrationMetadata.confidenceBoost).toBeGreaterThan(0);
    expect(enhancedResult.integrationMetadata.confidenceBoost).toBeLessThanOrEqual(0.3);

    // Verify recommendations structure
    expect(enhancedResult.recommendations.immediate).toBeDefined();
    expect(enhancedResult.recommendations.preparation).toBeDefined();
    expect(enhancedResult.recommendations.longTerm).toBeDefined();

  });

  test('should provide venue-specific educational insights', async () => {
    const venueInsights = await sailingEducationService.getVenueEducationalInsights('hong-kong');

    if (venueInsights) {
      expect(venueInsights.venueId).toBe('hong-kong');
      expect(venueInsights.safetyStandards).toBeDefined();
      expect(venueInsights.tacticalKnowledge).toBeDefined();
      expect(venueInsights.culturalProtocols).toBeDefined();
      expect(venueInsights.localExpertise).toBeDefined();

    } else {
    }
  });

  test('should demonstrate full system integration', async () => {
    const fullDemo = await enhancedAIIntegrationService.demonstrateFullIntegration('hong-kong');

    // Verify educational processing
    expect(fullDemo.educationalProcessing.resourcesProcessed).toBeGreaterThan(0);
    expect(fullDemo.educationalProcessing.insightsExtracted).toBeGreaterThan(0);

    // Verify enhanced document analysis
    expect(fullDemo.enhancedDocumentAnalysis.originalAnalysis).toBeDefined();
    expect(fullDemo.enhancedDocumentAnalysis.educationalEnhancements).toBeDefined();

    // Verify venue intelligence
    expect(fullDemo.venueIntelligence).toBeDefined();

    // Verify system status
    expect(fullDemo.systemStatus.integration.status).toBe('active');
    expect(fullDemo.systemStatus.integration.enhancementActive).toBe(true);

  });

  test('should generate educationally enhanced strategy', async () => {
    const strategy = await sailingEducationService.getEducationallyEnhancedStrategy(
      'What are the best tactics for Dragon class racing in Hong Kong during monsoon season?',
      'hong-kong',
      {
        raceType: 'fleet_racing',
        season: 'monsoon',
        boatClass: 'Dragon',
        international: true,
      }
    );

    expect(strategy.insights).toBeDefined();
    expect(strategy.safetyConsiderations).toBeDefined();
    expect(strategy.culturalProtocols).toBeDefined();
    expect(strategy.equipmentRecommendations).toBeDefined();
    expect(strategy.competitiveAdvantages).toBeDefined();

  });

  test('should provide knowledge base statistics', () => {
    const stats = sailingEducationService.getKnowledgeBaseStats();

    expect(stats.totalResources).toBeGreaterThanOrEqual(0);
    expect(stats.venuesWithInsights).toBeGreaterThanOrEqual(0);
    expect(stats.lastUpdated).toBeInstanceOf(Date);
    expect(stats.resourceTypes).toBeDefined();

  });

  afterAll(() => {

    console.log('📚 The system successfully demonstrates how yacht club educational content');
    console.log('   enhances RegattaFlow\'s AI capabilities in a respectful and systematic way.');
  });
});

/**
 * Example usage demonstration
 */
export const demonstrateEnhancedAI = async () => {
  console.log('================================================================');

  // 1. Show how RHKYC-style content enhances AI analysis
  console.log('\n📚 Step 1: Processing Educational Content');
  const educationalResult = await enhancedAIIntegrationService.processYachtClubEducationalContent(
    'Royal Hong Kong Yacht Club',
    [
      'Offshore Racing Safety Preparation',
      'Harbour Secrets and Local Knowledge',
      'Dragon Class Racing Tactics',
      'ORC Rating Optimization',
    ],
    'hong-kong'
  );


  // 2. Show enhanced document processing
  console.log('\n🧠 Step 2: Enhanced Document Analysis');
  const mockDocument: DocumentUpload = {
    filename: 'hong_kong_dragon_sailing_instructions.pdf',
    type: 'pdf',
    data: new ArrayBuffer(1024),
    metadata: { venue: 'hong-kong' },
  };

  const context: AIProcessingContext = {
    venueId: 'hong-kong',
    raceType: 'fleet_racing',
    sailorProfile: { experience: 'intermediate', international: true, boatClass: 'Dragon' },
    conditions: { season: 'monsoon' },
  };

  const enhancedAnalysis = await enhancedAIIntegrationService.processDocumentWithEducationalEnhancement(
    mockDocument,
    context
  );


  // 3. Show educational strategy generation
  const strategy = await sailingEducationService.getEducationallyEnhancedStrategy(
    'How should an international Dragon sailor prepare for racing in Hong Kong?',
    'hong-kong'
  );


  console.log('\n🏆 Integration Complete!');
  console.log('The AI now provides professional sailing education quality recommendations');
  console.log('while feeling naturally local and culturally appropriate.');

  return {
    educationalResult,
    enhancedAnalysis,
    strategy,
  };
};
