// @ts-nocheck

/**
 * Sailing Education Hook
 * Integrates yacht club educational resources with venue intelligence
 */

import { useState, useEffect, useCallback } from 'react';
import { sailingEducationService, type VenueEducationalInsights } from '@/services/ai/SailingEducationService';
import type {
  StrategyInsight,
  SafetyProtocol,
  CulturalProtocol,
  EquipmentRecommendation,
  CompetitiveIntelligence
} from '@/lib/types/ai-knowledge';

export interface EnhancedEducationalStrategy {
  insights: StrategyInsight[];
  safetyConsiderations: SafetyProtocol[];
  culturalProtocols: CulturalProtocol[];
  equipmentRecommendations: EquipmentRecommendation[];
  competitiveAdvantages: CompetitiveIntelligence[];
  educationalValue: string[];
}

export interface SailingEducationHook {
  loading: boolean;
  error: string | null;
  enhancedStrategy: EnhancedEducationalStrategy | null;
  knowledgeBaseStats: any;

  // Methods
  getEducationalStrategy: (query: string, venueId?: string, context?: any) => Promise<void>;
  refreshKnowledgeBase: () => void;
  clearError: () => void;
}

export const useSailingEducation = (venueId?: string): SailingEducationHook => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedStrategy, setEnhancedStrategy] = useState<EnhancedEducationalStrategy | null>(null);
  const [knowledgeBaseStats, setKnowledgeBaseStats] = useState(null);

  /**
   * Get educationally enhanced strategy incorporating yacht club training
   */
  const getEducationalStrategy = useCallback(async (
    query: string,
    targetVenueId?: string,
    context?: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      const venueToQuery = targetVenueId || venueId;

      const educationalResponse = await sailingEducationService.getEducationallyEnhancedStrategy(
        query,
        venueToQuery,
        context
      );

      // Enhance with educational value annotations
      const enhancedInsights = educationalResponse.insights.map(insight => ({
        ...insight,
        educationalValue: insight.educationalValue || 'Professional sailing education insight',
      }));

      const enhancedSafetyProtocols = educationalResponse.safetyConsiderations.map(protocol => ({
        ...protocol,
        compliance: protocol.compliance || 'Based on yacht club educational standards',
      }));

      const enhancedCulturalProtocols = educationalResponse.culturalProtocols.map(protocol => ({
        ...protocol,
        regionalContext: protocol.regionalContext || 'Informed by professional sailing education',
      }));

      const strategy: EnhancedEducationalStrategy = {
        insights: enhancedInsights,
        safetyConsiderations: enhancedSafetyProtocols,
        culturalProtocols: enhancedCulturalProtocols,
        equipmentRecommendations: educationalResponse.equipmentRecommendations,
        competitiveAdvantages: educationalResponse.competitiveAdvantages,
        educationalValue: [
          'Incorporates professional yacht club training standards',
          'Based on sailing organization educational principles',
          'Enhanced with cultural and protocol awareness',
          'Aligned with international racing best practices',
          'Reflects safety-first approach from professional sailing education',
        ],
      };

      setEnhancedStrategy(strategy);

    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get educational strategy';
      setError(errorMessage);
      console.error('📚 Sailing education strategy error:', err);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  /**
   * Refresh knowledge base statistics
   */
  const refreshKnowledgeBase = useCallback(() => {
    try {
      const stats = sailingEducationService.getKnowledgeBaseStats();
      setKnowledgeBaseStats(stats);
    } catch (err) {
      console.error('📚 Failed to refresh knowledge base stats:', err);
    }
  }, []);

  /**
   * Clear current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize knowledge base stats on mount
  useEffect(() => {
    refreshKnowledgeBase();
  }, [refreshKnowledgeBase]);

  // Auto-refresh stats periodically
  useEffect(() => {
    const interval = setInterval(refreshKnowledgeBase, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [refreshKnowledgeBase]);

  return {
    loading,
    error,
    enhancedStrategy,
    knowledgeBaseStats,
    getEducationalStrategy,
    refreshKnowledgeBase,
    clearError,
  };
};

/**
 * Hook specifically for venue-based sailing education
 */
export const useVenueSailingEducation = (venueId: string) => {
  const baseHook = useSailingEducation(venueId);
  const [venueInsights, setVenueInsights] = useState<VenueEducationalInsights | null>(null);

  const loadVenueEducationalInsights = useCallback(async () => {
    try {
      const insights = await sailingEducationService.getVenueEducationalInsights(venueId);
      setVenueInsights(insights);
    } catch (err) {
      console.error(`📚 Failed to load venue insights for ${venueId}:`, err);
    }
  }, [venueId]);

  useEffect(() => {
    if (venueId) {
      loadVenueEducationalInsights();
    }
  }, [venueId, loadVenueEducationalInsights]);

  return {
    ...baseHook,
    venueInsights,
    loadVenueEducationalInsights,
  };
};

/**
 * Hook for integrating sailing education with AI document processing
 */
export const useEducationalDocumentProcessing = () => {
  const [processing, setProcessing] = useState(false);

  const processEducationalDocument = useCallback(async (
    organizationName: string,
    documentContent: any,
    applicableVenues: string[] = []
  ) => {
    setProcessing(true);
    try {

      const resource = await sailingEducationService.processYachtClubEducation(
        organizationName,
        documentContent,
        applicableVenues
      );

      return resource;
    } catch (err) {
      console.error('📚 Educational document processing failed:', err);
      throw err;
    } finally {
      setProcessing(false);
    }
  }, []);

  return {
    processing,
    processEducationalDocument,
  };
};

export default useSailingEducation;
