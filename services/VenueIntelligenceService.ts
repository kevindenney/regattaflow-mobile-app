/**
 * Venue Intelligence Service
 * Saves and retrieves AI-generated venue insights to/from database
 */

import { supabase } from './supabase';

export interface VenueInsights {
  venueId: string;
  venueName: string;
  analysis: string;
  generatedAt: string;
  intelligence?: any;
  recommendations: {
    safety: string;
    racing: string;
    cultural: string;
    practice: string;
    timing: string;
  };
}

export class VenueIntelligenceService {
  /**
   * Save AI-generated insights to venue_conditions table
   */
  async saveVenueInsights(insights: VenueInsights): Promise<{ success: boolean; error?: string }> {
    try {
      const { venueId, recommendations, analysis } = insights;

      // Check if venue_conditions already exists for this venue
      const { data: existing, error: fetchError } = await supabase
        .from('venue_conditions')
        .select('id')
        .eq('venue_id', venueId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Error other than "not found"
        throw fetchError;
      }

      // Build AI insights JSONB structure
      const aiInsights = {
        generatedAt: insights.generatedAt,
        analysis: analysis,
        recommendations: {
          safety: recommendations.safety,
          racing: recommendations.racing,
          cultural: recommendations.cultural,
          practice: recommendations.practice,
          timing: recommendations.timing,
        },
      };

      if (existing) {
        // Update existing record - add AI insights to hazards field
        const { error: updateError } = await supabase
          .from('venue_conditions')
          .update({
            hazards: [
              {
                type: 'ai_generated_insights',
                description: 'AI-generated venue intelligence',
                severity: 'info',
                insights: aiInsights,
              },
            ],
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase.from('venue_conditions').insert({
          venue_id: venueId,
          typical_conditions: {},
          wind_patterns: [],
          current_data: [],
          seasonal_variations: [],
          racing_areas: [],
          hazards: [
            {
              type: 'ai_generated_insights',
              description: 'AI-generated venue intelligence',
              severity: 'info',
              insights: aiInsights,
            },
          ],
        });

        if (insertError) throw insertError;
      }

      return { success: true };
    } catch (error: any) {

      return {
        success: false,
        error: error.message || 'Failed to save insights',
      };
    }
  }

  /**
   * Retrieve saved AI insights for a venue
   */
  async getVenueInsights(venueId: string): Promise<VenueInsights | null> {
    try {
      const { data, error } = await supabase
        .from('venue_conditions')
        .select('hazards, venue_id')
        .eq('venue_id', venueId)
        .single();

      if (error) throw error;
      if (!data || !data.hazards) return null;

      // Extract AI insights from hazards array
      const aiHazard = data.hazards.find((h: any) => h.type === 'ai_generated_insights');

      if (!aiHazard || !aiHazard.insights) return null;

      const insights: VenueInsights = {
        venueId: data.venue_id,
        venueName: '', // Will be populated from venue data if needed
        analysis: aiHazard.insights.analysis || '',
        generatedAt: aiHazard.insights.generatedAt,
        recommendations: aiHazard.insights.recommendations || {
          safety: '',
          racing: '',
          cultural: '',
          practice: '',
          timing: '',
        },
      };

      return insights;
    } catch (error: any) {

      return null;
    }
  }

  /**
   * Check if AI insights exist for a venue
   */
  async hasInsights(venueId: string): Promise<boolean> {
    const insights = await this.getVenueInsights(venueId);
    return insights !== null;
  }

  /**
   * Delete AI insights for a venue (if user wants to regenerate)
   */
  async deleteInsights(venueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current hazards
      const { data, error: fetchError } = await supabase
        .from('venue_conditions')
        .select('id, hazards')
        .eq('venue_id', venueId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) return { success: true }; // Nothing to delete

      // Filter out AI insights
      const updatedHazards = data.hazards.filter((h: any) => h.type !== 'ai_generated_insights');

      // Update record
      const { error: updateError } = await supabase
        .from('venue_conditions')
        .update({
          hazards: updatedHazards,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error: any) {

      return {
        success: false,
        error: error.message || 'Failed to delete insights',
      };
    }
  }
}

export const venueIntelligenceService = new VenueIntelligenceService();
