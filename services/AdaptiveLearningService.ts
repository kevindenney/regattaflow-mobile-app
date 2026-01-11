/**
 * AdaptiveLearningService
 *
 * Service for the adaptive learning system that extracts insights from race feedback
 * and generates personalized nudges for future races.
 */

import { supabase } from './supabase';
import { logger, serializeError } from '@/lib/utils/logger';
import { skillManagementService } from './ai/SkillManagementService';
import {
  LEARNING_EVENT_EXTRACTOR_SKILL_CONTENT,
  buildExtractionPrompt,
} from '@/skills/learning-event-extractor/skillContent';
import type {
  LearnableEvent,
  LearnableEventRow,
  LearnableEventType,
  LearnableEventOutcome,
  CreateLearnableEventInput,
  ConditionsContext,
  ExtractionSourceType,
  ExtractionInput,
  ExtractedEvent,
  ExtractionResult,
  PersonalizedNudge,
  PersonalizedNudgeSet,
  NudgeDelivery,
  NudgeDeliveryRow,
  NudgeDeliveryChannel,
  GenerateNudgesOptions,
  GetLearnableEventsOptions,
} from '@/types/adaptiveLearning';
import {
  mapRowToLearnableEvent,
  mapRowToNudgeDelivery,
} from '@/types/adaptiveLearning';
import type { RacePhase, ChecklistCategory } from '@/types/excellenceFramework';

// Anthropic client for AI extraction
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

export class AdaptiveLearningService {
  // ============================================
  // Event Extraction
  // ============================================

  /**
   * Extract learnable events from text using AI
   */
  static async extractEventsFromText(
    text: string,
    sourceType: ExtractionSourceType,
    context: ExtractionInput['context'] = {}
  ): Promise<ExtractionResult> {
    try {
      if (!text || text.trim().length < 10) {
        return { events: [] };
      }

      const prompt = buildExtractionPrompt({
        text,
        sourceType,
        context,
      });

      // Call Claude API with the extraction skill
      const response = await this.callClaudeForExtraction(prompt);

      if (!response) {
        logger.warn('No response from extraction API');
        return { events: [] };
      }

      return response;
    } catch (error) {
      logger.error('Error in extractEventsFromText', { error });
      return { events: [], extractionNotes: `Extraction failed: ${error}` };
    }
  }

  /**
   * Call Claude API for event extraction
   */
  private static async callClaudeForExtraction(
    prompt: string
  ): Promise<ExtractionResult | null> {
    try {
      if (!ANTHROPIC_API_KEY) {
        logger.warn('No Anthropic API key configured');
        return null;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: LEARNING_EVENT_EXTRACTOR_SKILL_CONTENT,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Claude API error', { status: response.status, error: errorText });
        return null;
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;

      if (!content) {
        logger.warn('Empty response from Claude');
        return null;
      }

      // Parse JSON response - strip markdown code blocks if present
      try {
        let jsonContent = content.trim();

        // Strip markdown code blocks (```json ... ``` or ``` ... ```)
        if (jsonContent.startsWith('```')) {
          // Remove opening ``` and optional language identifier
          jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '');
          // Remove closing ```
          jsonContent = jsonContent.replace(/\n?```\s*$/, '');
        }

        const result = JSON.parse(jsonContent) as ExtractionResult;
        return result;
      } catch (parseError) {
        logger.error('Failed to parse extraction response', { content, parseError });
        return null;
      }
    } catch (error) {
      logger.error('Error calling Claude for extraction', { error });
      return null;
    }
  }

  /**
   * Process race completion and extract learnings
   */
  static async processRaceCompletion(
    sailorId: string,
    raceEventId: string,
    feedback: {
      narrative?: string;
      keyMoments?: { description: string; phase?: RacePhase }[];
      phaseNotes?: { phase: RacePhase; notes: string }[];
    },
    context: ExtractionInput['context'] = {}
  ): Promise<LearnableEvent[]> {
    try {
      const allEvents: LearnableEvent[] = [];

      // Extract from narrative
      if (feedback.narrative) {
        const result = await this.extractEventsFromText(
          feedback.narrative,
          'post_race_narrative',
          context
        );

        for (const event of result.events) {
          if (event.confidence >= 0.7) {
            const created = await this.createLearnableEvent(sailorId, {
              raceEventId,
              venueId: context.venueId,
              eventType: event.eventType as LearnableEventType,
              phase: this.mapCategoryToPhase(event.category),
              category: event.category as ChecklistCategory,
              originalText: event.originalText,
              title: event.eventSummary,
              actionText: event.actionText,
              outcome: event.outcome,
              conditionsContext: event.relevantConditions,
              aiExtracted: true,
              aiConfidence: event.confidence,
              eventDate: context.date,
            });
            if (created) allEvents.push(created);
          }
        }
      }

      // Extract from key moments
      if (feedback.keyMoments) {
        for (const moment of feedback.keyMoments) {
          const result = await this.extractEventsFromText(
            moment.description,
            'key_moment',
            context
          );

          for (const event of result.events) {
            if (event.confidence >= 0.7) {
              const created = await this.createLearnableEvent(sailorId, {
                raceEventId,
                venueId: context.venueId,
                eventType: event.eventType as LearnableEventType,
                phase: moment.phase || this.mapCategoryToPhase(event.category),
                category: event.category as ChecklistCategory,
                originalText: event.originalText,
                title: event.eventSummary,
                actionText: event.actionText,
                outcome: event.outcome,
                conditionsContext: event.relevantConditions,
                aiExtracted: true,
                aiConfidence: event.confidence,
                eventDate: context.date,
              });
              if (created) allEvents.push(created);
            }
          }
        }
      }

      // Extract from phase notes
      if (feedback.phaseNotes) {
        for (const phaseNote of feedback.phaseNotes) {
          const result = await this.extractEventsFromText(
            phaseNote.notes,
            'phase_notes',
            context
          );

          for (const event of result.events) {
            if (event.confidence >= 0.6) {
              // Lower threshold for phase notes
              const created = await this.createLearnableEvent(sailorId, {
                raceEventId,
                venueId: context.venueId,
                eventType: event.eventType as LearnableEventType,
                phase: phaseNote.phase,
                category: event.category as ChecklistCategory,
                originalText: event.originalText,
                title: event.eventSummary,
                actionText: event.actionText,
                outcome: event.outcome,
                conditionsContext: event.relevantConditions,
                aiExtracted: true,
                aiConfidence: event.confidence,
                eventDate: context.date,
              });
              if (created) allEvents.push(created);
            }
          }
        }
      }

      return allEvents;
    } catch (error) {
      logger.error('Error in processRaceCompletion', { error });
      return [];
    }
  }

  /**
   * Map category string to RacePhase
   */
  private static mapCategoryToPhase(category?: string): RacePhase | undefined {
    const mapping: Record<string, RacePhase> = {
      forecast: 'prep',
      equipment: 'prep',
      tactics: 'prep',
      logistics: 'prep',
      rigging: 'launch',
      safety: 'launch',
      crew: 'launch',
      start: 'race',
      upwind: 'race',
      downwind: 'race',
      marks: 'race',
      finish: 'race',
      reflection: 'review',
      learning: 'review',
    };
    return category ? mapping[category] : undefined;
  }

  // ============================================
  // Learnable Event CRUD
  // ============================================

  /**
   * Create a new learnable event
   *
   * Note: The raceEventId may actually be a regattas.id (not a race_events.id),
   * since the PostRaceInterview flow uses regatta IDs. This method will detect
   * and handle both cases.
   */
  static async createLearnableEvent(
    sailorId: string,
    input: CreateLearnableEventInput
  ): Promise<LearnableEvent | null> {
    try {
      let actualRaceEventId: string | null = null;
      let regattaId: string | null = input.regattaId || null;

      // If we have a raceEventId, check if it's actually a race_event or a regatta
      if (input.raceEventId) {
        // First, try to find a race_event with this ID
        const { data: raceEvent } = await supabase
          .from('race_events')
          .select('id')
          .eq('id', input.raceEventId)
          .maybeSingle();

        if (raceEvent) {
          // It's a valid race_event ID
          actualRaceEventId = raceEvent.id;
        } else {
          // It's probably a regatta ID, not a race_event ID
          // Store it as regatta_id and look up any linked race_event
          regattaId = input.raceEventId;

          // Try to find a race_event linked to this regatta
          const { data: linkedRaceEvent } = await supabase
            .from('race_events')
            .select('id')
            .eq('regatta_id', input.raceEventId)
            .maybeSingle();

          if (linkedRaceEvent) {
            actualRaceEventId = linkedRaceEvent.id;
          }
          // If no linked race_event exists, actualRaceEventId stays null
        }
      }

      const row: Partial<LearnableEventRow> = {
        sailor_id: sailorId,
        race_event_id: actualRaceEventId,
        regatta_id: regattaId,
        venue_id: input.venueId || null,
        event_type: input.eventType,
        phase: input.phase || null,
        category: input.category || null,
        original_text: input.originalText,
        title: input.title,
        action_text: input.actionText,
        outcome: input.outcome,
        impact_rating: input.impactRating || null,
        conditions_context: input.conditionsContext || {},
        ai_extracted: input.aiExtracted || false,
        ai_confidence: input.aiConfidence || null,
        sailor_confirmed: false,
        nudge_eligible: true,
        times_surfaced: 0,
        dismissed: false,
        event_date: input.eventDate || null,
      };

      const { data, error } = await supabase
        .from('learnable_events')
        .insert(row)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create learnable event', { error, input, actualRaceEventId, regattaId });
        return null;
      }

      return mapRowToLearnableEvent(data);
    } catch (error) {
      logger.error('Error in createLearnableEvent', { error });
      return null;
    }
  }

  /**
   * Get learnable events with filtering options
   */
  static async getLearnableEvents(
    options: GetLearnableEventsOptions
  ): Promise<LearnableEvent[]> {
    try {
      let query = supabase
        .from('learnable_events')
        .select('*')
        .eq('sailor_id', options.sailorId)
        .order('created_at', { ascending: false });

      if (options.raceEventId) {
        query = query.eq('race_event_id', options.raceEventId);
      }

      if (options.venueId) {
        query = query.eq('venue_id', options.venueId);
      }

      if (options.eventType) {
        query = query.eq('event_type', options.eventType);
      }

      if (options.phase) {
        query = query.eq('phase', options.phase);
      }

      if (options.nudgeEligibleOnly) {
        query = query.eq('nudge_eligible', true).eq('dismissed', false);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to get learnable events', { error, options });
        return [];
      }

      return (data || []).map(mapRowToLearnableEvent);
    } catch (error) {
      logger.error('Error in getLearnableEvents', serializeError(error));
      return [];
    }
  }

  /**
   * Confirm a learnable event (sailor verified it's correct)
   */
  static async confirmEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('learnable_events')
        .update({ sailor_confirmed: true })
        .eq('id', eventId);

      if (error) {
        logger.error('Failed to confirm event', { error, eventId });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in confirmEvent', { error });
      return false;
    }
  }

  /**
   * Dismiss a learnable event (sailor doesn't want this nudge)
   */
  static async dismissEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('learnable_events')
        .update({
          dismissed: true,
          dismissed_at: new Date().toISOString(),
          nudge_eligible: false,
        })
        .eq('id', eventId);

      if (error) {
        logger.error('Failed to dismiss event', { error, eventId });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in dismissEvent', { error });
      return false;
    }
  }

  /**
   * Rate the effectiveness of a nudge
   */
  static async rateEventEffectiveness(
    eventId: string,
    rating: number
  ): Promise<boolean> {
    try {
      if (rating < 1 || rating > 5) {
        logger.warn('Invalid effectiveness rating', { eventId, rating });
        return false;
      }

      const { error } = await supabase
        .from('learnable_events')
        .update({ effectiveness_rating: rating })
        .eq('id', eventId);

      if (error) {
        logger.error('Failed to rate event effectiveness', { error, eventId });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in rateEventEffectiveness', { error });
      return false;
    }
  }

  // ============================================
  // Nudge Generation
  // ============================================

  /**
   * Generate personalized nudges for a race
   */
  static async generatePersonalizedNudges(
    options: GenerateNudgesOptions
  ): Promise<PersonalizedNudgeSet> {
    try {
      // Get eligible learnable events
      const events = await this.getLearnableEvents({
        sailorId: options.sailorId,
        nudgeEligibleOnly: true,
        limit: 100,
      });

      // Score and filter events based on context matching
      const scoredNudges: PersonalizedNudge[] = [];

      for (const event of events) {
        const matchResult = this.calculateMatchScore(event, {
          venueId: options.venueId,
          windSpeed: options.forecast?.windSpeed,
          windDirection: options.forecast?.windDirection,
          boatClassId: options.boatClassId,
          raceType: options.raceType,
        });

        if (matchResult.score >= 0.3) {
          scoredNudges.push({
            id: `nudge_${event.id}`,
            learnableEventId: event.id,
            title: event.title,
            message: event.actionText,
            actionText: event.actionText,
            category: event.eventType,
            matchScore: matchResult.score,
            matchReasons: matchResult.reasons,
            sourceRaceDate: event.eventDate,
            outcome: event.outcome,
            isNew: event.timesSurfaced === 0,
          });
        }
      }

      // Sort by match score
      scoredNudges.sort((a, b) => b.matchScore - a.matchScore);

      // Group nudges by display context
      const checklistAdditions = scoredNudges
        .filter(
          (n) =>
            n.category === 'forgotten_item' ||
            n.category === 'timing_issue' ||
            n.category === 'equipment_issue'
        )
        .slice(0, 3);

      const venueInsights = scoredNudges
        .filter((n) => n.category === 'venue_learning')
        .slice(0, 3);

      const conditionsInsights = scoredNudges
        .filter(
          (n) =>
            n.category === 'weather_adaptation' ||
            n.category === 'performance_issue' ||
            n.category === 'successful_strategy'
        )
        .slice(0, 3);

      const reminders = scoredNudges
        .filter(
          (n) =>
            n.category === 'decision_outcome' ||
            n.category === 'crew_coordination'
        )
        .slice(0, 2);

      // Limit total nudges
      const allNudges = [
        ...checklistAdditions,
        ...venueInsights,
        ...conditionsInsights,
        ...reminders,
      ];
      const limitedNudges = allNudges.slice(0, options.limit || 8);

      return {
        sailorId: options.sailorId,
        raceEventId: options.raceEventId,
        checklistAdditions: checklistAdditions.filter((n) =>
          limitedNudges.includes(n)
        ),
        venueInsights: venueInsights.filter((n) => limitedNudges.includes(n)),
        conditionsInsights: conditionsInsights.filter((n) =>
          limitedNudges.includes(n)
        ),
        reminders: reminders.filter((n) => limitedNudges.includes(n)),
        totalCount: limitedNudges.length,
        highPriorityCount: limitedNudges.filter((n) => n.matchScore >= 0.7)
          .length,
        generatedAt: new Date().toISOString(),
        conditionsSnapshot: options.forecast
          ? {
              windSpeed: options.forecast.windSpeed,
              windDirection: options.forecast.windDirection,
              venue: options.venueId,
            }
          : undefined,
      };
    } catch (error) {
      logger.error('Error in generatePersonalizedNudges', { error });
      return {
        sailorId: options.sailorId,
        raceEventId: options.raceEventId,
        checklistAdditions: [],
        venueInsights: [],
        conditionsInsights: [],
        reminders: [],
        totalCount: 0,
        highPriorityCount: 0,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Calculate match score for an event against current context
   */
  private static calculateMatchScore(
    event: LearnableEvent,
    context: {
      venueId?: string;
      windSpeed?: number;
      windDirection?: number;
      boatClassId?: string;
      raceType?: string;
    }
  ): { score: number; reasons: string[] } {
    let score = 0.3; // Base score
    const reasons: string[] = [];

    const conditions = event.conditionsContext;

    // Venue match (+0.3)
    if (context.venueId && conditions.venueSpecific && conditions.venueId) {
      if (context.venueId === conditions.venueId) {
        score += 0.3;
        reasons.push('Same venue as previous learning');
      }
    } else if (conditions.venueSpecific && event.venueId === context.venueId) {
      score += 0.3;
      reasons.push('Venue-specific insight');
    }

    // Wind speed match (+0.2)
    if (context.windSpeed && conditions.windSpeedRange) {
      const [min, max] = conditions.windSpeedRange;
      if (context.windSpeed >= min && context.windSpeed <= max) {
        score += 0.2;
        reasons.push(`Similar wind conditions (${min}-${max} kt)`);
      }
    }

    // Boat class match (+0.15)
    if (context.boatClassId && conditions.boatClassId) {
      if (context.boatClassId === conditions.boatClassId) {
        score += 0.15;
        reasons.push('Same boat class');
      }
    }

    // Race type match (+0.1)
    if (context.raceType && conditions.raceType) {
      if (context.raceType === conditions.raceType) {
        score += 0.1;
        reasons.push(`${context.raceType} racing`);
      }
    }

    // Positive outcome bonus (+0.1)
    if (event.outcome === 'positive') {
      score += 0.1;
      reasons.push('Successful strategy to repeat');
    }

    // Sailor confirmed bonus (+0.15)
    if (event.sailorConfirmed) {
      score += 0.15;
      reasons.push('Confirmed by you');
    }

    // Recency bonus (30 days)
    if (event.eventDate) {
      const daysSince = Math.floor(
        (Date.now() - new Date(event.eventDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince <= 30) {
        score += 0.1;
        reasons.push('Recent learning');
      }
    }

    // Fatigue penalty (surfaced too recently)
    if (event.timesSurfaced >= 3 && event.lastSurfacedAt) {
      const daysSinceSurfaced = Math.floor(
        (Date.now() - new Date(event.lastSurfacedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysSinceSurfaced < 7) {
        score -= 0.2;
        reasons.push('Shown recently - reduced priority');
      }
    }

    return { score: Math.min(1, Math.max(0, score)), reasons };
  }

  // ============================================
  // Nudge Delivery Tracking
  // ============================================

  /**
   * Record that a nudge was delivered
   */
  static async recordNudgeDelivery(
    learnableEventId: string,
    sailorId: string,
    channel: NudgeDeliveryChannel,
    raceEventId?: string
  ): Promise<NudgeDelivery | null> {
    try {
      // Record the delivery
      const { data, error } = await supabase
        .from('nudge_deliveries')
        .insert({
          learnable_event_id: learnableEventId,
          sailor_id: sailorId,
          race_event_id: raceEventId || null,
          delivery_channel: channel,
          delivered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to record nudge delivery', { error });
        return null;
      }

      // Update times_surfaced and last_surfaced_at on the event
      await supabase.rpc('increment_nudge_surfaced', {
        event_id: learnableEventId,
      });

      return mapRowToNudgeDelivery(data);
    } catch (error) {
      logger.error('Error in recordNudgeDelivery', { error });
      return null;
    }
  }

  /**
   * Record that a nudge was acknowledged
   */
  static async recordNudgeAcknowledged(deliveryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('nudge_deliveries')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) {
        logger.error('Failed to record nudge acknowledgment', { error });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in recordNudgeAcknowledged', { error });
      return false;
    }
  }

  /**
   * Record that action was taken on a nudge
   */
  static async recordNudgeActionTaken(deliveryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('nudge_deliveries')
        .update({
          action_taken: true,
          action_taken_at: new Date().toISOString(),
        })
        .eq('id', deliveryId);

      if (error) {
        logger.error('Failed to record nudge action', { error });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error in recordNudgeActionTaken', { error });
      return false;
    }
  }

  /**
   * Record the outcome of following a nudge
   */
  static async recordNudgeOutcome(
    deliveryId: string,
    rating: number,
    notes?: string,
    issueRecurred?: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('nudge_deliveries')
        .update({
          outcome_rating: rating,
          outcome_notes: notes || null,
          issue_recurred: issueRecurred ?? null,
        })
        .eq('id', deliveryId);

      if (error) {
        logger.error('Failed to record nudge outcome', { error });
        return false;
      }

      // Adjust confidence based on outcome
      const { data: delivery } = await supabase
        .from('nudge_deliveries')
        .select('learnable_event_id, action_taken')
        .eq('id', deliveryId)
        .single();

      if (delivery) {
        await this.adjustNudgeConfidence(
          delivery.learnable_event_id,
          delivery.action_taken || false,
          rating,
          issueRecurred || false
        );
      }

      return true;
    } catch (error) {
      logger.error('Error in recordNudgeOutcome', { error });
      return false;
    }
  }

  /**
   * Adjust nudge confidence based on outcome data
   */
  private static async adjustNudgeConfidence(
    eventId: string,
    actionTaken: boolean,
    outcomeRating: number,
    issueRecurred: boolean
  ): Promise<void> {
    try {
      const { data: event } = await supabase
        .from('learnable_events')
        .select('ai_confidence, nudge_eligible')
        .eq('id', eventId)
        .single();

      if (!event) return;

      let confidenceAdjustment = 0;

      // Action + good outcome: +0.05
      if (actionTaken && outcomeRating >= 4) {
        confidenceAdjustment = 0.05;
      }
      // Action + poor outcome: -0.10
      else if (actionTaken && outcomeRating <= 2) {
        confidenceAdjustment = -0.1;
      }
      // No action + issue recurred: +0.03 (nudge was right!)
      else if (!actionTaken && issueRecurred) {
        confidenceAdjustment = 0.03;
      }
      // No action + no recurrence: -0.02
      else if (!actionTaken && !issueRecurred) {
        confidenceAdjustment = -0.02;
      }

      const newConfidence = Math.min(
        0.95,
        Math.max(0.1, (event.ai_confidence || 0.5) + confidenceAdjustment)
      );

      // If confidence drops too low, disable nudge
      const shouldDisable = newConfidence < 0.3;

      await supabase
        .from('learnable_events')
        .update({
          ai_confidence: newConfidence,
          nudge_eligible: shouldDisable ? false : event.nudge_eligible,
        })
        .eq('id', eventId);
    } catch (error) {
      logger.error('Error in adjustNudgeConfidence', { error });
    }
  }

  // ============================================
  // Learning Insights
  // ============================================

  /**
   * Get summary insights about a sailor's learnings
   */
  static async getLearningInsights(sailorId: string): Promise<{
    totalEvents: number;
    positiveEvents: number;
    negativeEvents: number;
    topCategories: { category: LearnableEventType; count: number }[];
    recentLearnings: LearnableEvent[];
  }> {
    try {
      const events = await this.getLearnableEvents({
        sailorId,
        limit: 100,
      });

      const positive = events.filter((e) => e.outcome === 'positive').length;
      const negative = events.filter((e) => e.outcome === 'negative').length;

      // Count by category
      const categoryCounts: Record<string, number> = {};
      for (const event of events) {
        categoryCounts[event.eventType] =
          (categoryCounts[event.eventType] || 0) + 1;
      }

      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category: category as LearnableEventType,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalEvents: events.length,
        positiveEvents: positive,
        negativeEvents: negative,
        topCategories,
        recentLearnings: events.slice(0, 5),
      };
    } catch (error) {
      logger.error('Error in getLearningInsights', serializeError(error));
      return {
        totalEvents: 0,
        positiveEvents: 0,
        negativeEvents: 0,
        topCategories: [],
        recentLearnings: [],
      };
    }
  }
}

export default AdaptiveLearningService;
