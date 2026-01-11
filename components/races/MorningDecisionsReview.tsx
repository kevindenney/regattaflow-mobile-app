/**
 * MorningDecisionsReview Component
 *
 * Post-race review of morning checklist decisions.
 * Shows what was recommended, what the user decided, and captures feedback
 * to feed into the AI learning loop.
 *
 * Design: Tufte-inspired, minimal, focused on capturing valuable feedback.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Star, Wrench, Sailboat, Target, CloudSun, ChevronDown, ChevronUp } from 'lucide-react-native';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { AdaptiveLearningService } from '@/services/AdaptiveLearningService';
import { createLogger } from '@/lib/utils/logger';
import type {
  MorningChecklistIntentions,
  MorningChecklistFeedback,
  ChecklistItemFeedback,
} from '@/types/morningChecklist';

const logger = createLogger('MorningDecisionsReview');

// iOS System Colors
const IOS_COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C434A',
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  blue: '#007AFF',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  green: '#34C759',
  yellow: '#FFCC00',
  orange: '#FF9500',
};

interface MorningDecisionsReviewProps {
  raceEventId: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface DecisionSection {
  id: 'forecast' | 'rigTuning' | 'sailSelection' | 'tactics';
  icon: React.ComponentType<any>;
  label: string;
  intention?: any;
}

/**
 * Star rating component
 */
function StarRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <View style={styles.ratingRow}>
      {label && <Text style={styles.ratingLabel}>{label}</Text>}
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Star
              size={24}
              color={star <= value ? IOS_COLORS.yellow : IOS_COLORS.gray3}
              fill={star <= value ? IOS_COLORS.yellow : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/**
 * Collapsible section for each decision type
 */
function DecisionFeedbackSection({
  section,
  feedback,
  onFeedbackChange,
  isExpanded,
  onToggleExpand,
}: {
  section: DecisionSection;
  feedback: Partial<ChecklistItemFeedback>;
  onFeedbackChange: (field: keyof ChecklistItemFeedback, value: any) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const Icon = section.icon;
  const hasIntention = !!section.intention;

  if (!hasIntention) return null;

  return (
    <View style={styles.decisionSection}>
      <TouchableOpacity
        style={styles.decisionHeader}
        onPress={onToggleExpand}
      >
        <View style={styles.decisionHeaderLeft}>
          <Icon size={18} color={IOS_COLORS.secondaryLabel} />
          <Text style={styles.decisionLabel}>{section.label}</Text>
        </View>
        <View style={styles.decisionHeaderRight}>
          {feedback.effectiveness ? (
            <View style={styles.miniRating}>
              <Star size={14} color={IOS_COLORS.yellow} fill={IOS_COLORS.yellow} />
              <Text style={styles.miniRatingText}>{feedback.effectiveness}</Text>
            </View>
          ) : (
            <Text style={styles.tapToRate}>Tap to rate</Text>
          )}
          {isExpanded ? (
            <ChevronUp size={18} color={IOS_COLORS.gray} />
          ) : (
            <ChevronDown size={18} color={IOS_COLORS.gray} />
          )}
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.decisionContent}>
          {/* Show what was decided pre-race */}
          {section.intention?.userNotes && (
            <View style={styles.preRaceNotes}>
              <Text style={styles.preRaceNotesLabel}>Your pre-race notes:</Text>
              <Text style={styles.preRaceNotesText}>
                "{section.intention.userNotes}"
              </Text>
            </View>
          )}

          {/* Rating */}
          <StarRating
            label="How well did it work?"
            value={feedback.effectiveness || 0}
            onChange={(v) => onFeedbackChange('effectiveness', v)}
          />

          {/* What worked */}
          <View style={styles.feedbackField}>
            <Text style={styles.feedbackFieldLabel}>What worked</Text>
            <TextInput
              style={styles.feedbackInput}
              value={feedback.whatWorked || ''}
              onChangeText={(text) => onFeedbackChange('whatWorked', text)}
              placeholder="Good decisions..."
              placeholderTextColor={IOS_COLORS.gray3}
            />
          </View>

          {/* What to change */}
          <View style={styles.feedbackField}>
            <Text style={styles.feedbackFieldLabel}>What to change</Text>
            <TextInput
              style={styles.feedbackInput}
              value={feedback.whatToChange || ''}
              onChangeText={(text) => onFeedbackChange('whatToChange', text)}
              placeholder="For next time..."
              placeholderTextColor={IOS_COLORS.gray3}
            />
          </View>
        </View>
      )}
    </View>
  );
}

export function MorningDecisionsReview({
  raceEventId,
  onComplete,
  onSkip,
}: MorningDecisionsReviewProps) {
  const { user } = useAuth();
  const [intentions, setIntentions] = useState<MorningChecklistIntentions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [overallRating, setOverallRating] = useState(0);
  const [overallNotes, setOverallNotes] = useState('');

  // Feedback state for each section
  const [forecastFeedback, setForecastFeedback] = useState<Partial<ChecklistItemFeedback>>({});
  const [rigFeedback, setRigFeedback] = useState<Partial<ChecklistItemFeedback>>({});
  const [sailFeedback, setSailFeedback] = useState<Partial<ChecklistItemFeedback>>({});
  const [tacticsFeedback, setTacticsFeedback] = useState<Partial<ChecklistItemFeedback>>({});

  // Load pre-race intentions AND any previously saved feedback
  useEffect(() => {
    async function loadIntentionsAndFeedback() {
      try {
        const { data, error } = await supabase
          .from('sailor_race_preparation')
          .select('morning_intentions, morning_feedback')
          .eq('race_event_id', raceEventId)
          .maybeSingle();

        if (error) throw error;

        if (data?.morning_intentions) {
          setIntentions(data.morning_intentions as MorningChecklistIntentions);
          // Auto-expand first section with data
          const sections = ['forecast', 'rigTuning', 'sailSelection', 'tactics'];
          for (const s of sections) {
            if ((data.morning_intentions as any)[s]) {
              setExpandedSection(s);
              break;
            }
          }
        }

        // Load previously saved feedback if it exists
        if (data?.morning_feedback) {
          const feedback = data.morning_feedback as MorningChecklistFeedback;
          if (feedback.forecast) {
            setForecastFeedback({
              effectiveness: feedback.forecast.effectiveness,
              whatWorked: feedback.forecast.whatWorked,
              whatToChange: feedback.forecast.whatToChange,
            });
          }
          if (feedback.rigTuning) {
            setRigFeedback({
              effectiveness: feedback.rigTuning.effectiveness,
              whatWorked: feedback.rigTuning.whatWorked,
              whatToChange: feedback.rigTuning.whatToChange,
            });
          }
          if (feedback.sailSelection) {
            setSailFeedback({
              effectiveness: feedback.sailSelection.effectiveness,
              whatWorked: feedback.sailSelection.whatWorked,
              whatToChange: feedback.sailSelection.whatToChange,
            });
          }
          if (feedback.tactics) {
            setTacticsFeedback({
              effectiveness: feedback.tactics.effectiveness,
              whatWorked: feedback.tactics.whatWorked,
              whatToChange: feedback.tactics.whatToChange,
            });
          }
          if (feedback.overallRating) {
            setOverallRating(feedback.overallRating);
          }
          if (feedback.overallNotes) {
            setOverallNotes(feedback.overallNotes);
          }
        }
      } catch (err) {
        logger.error('Error loading intentions:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadIntentionsAndFeedback();
  }, [raceEventId]);

  // Build sections list
  const sections: DecisionSection[] = useMemo(() => [
    {
      id: 'forecast',
      icon: CloudSun,
      label: 'Forecast Check',
      intention: intentions?.forecast,
    },
    {
      id: 'rigTuning',
      icon: Wrench,
      label: 'Rig Tuning',
      intention: intentions?.rigTuning,
    },
    {
      id: 'sailSelection',
      icon: Sailboat,
      label: 'Sail Selection',
      intention: intentions?.sailSelection,
    },
    {
      id: 'tactics',
      icon: Target,
      label: 'Tactics',
      intention: intentions?.tactics,
    },
  ], [intentions]);

  const sectionsWithData = sections.filter(s => s.intention);

  // Handle feedback change for a section
  const handleFeedbackChange = (
    sectionId: string,
    field: keyof ChecklistItemFeedback,
    value: any
  ) => {
    switch (sectionId) {
      case 'forecast':
        setForecastFeedback(prev => ({ ...prev, [field]: value }));
        break;
      case 'rigTuning':
        setRigFeedback(prev => ({ ...prev, [field]: value }));
        break;
      case 'sailSelection':
        setSailFeedback(prev => ({ ...prev, [field]: value }));
        break;
      case 'tactics':
        setTacticsFeedback(prev => ({ ...prev, [field]: value }));
        break;
    }
  };

  // Get feedback for a section
  const getFeedbackForSection = (sectionId: string): Partial<ChecklistItemFeedback> => {
    switch (sectionId) {
      case 'forecast': return forecastFeedback;
      case 'rigTuning': return rigFeedback;
      case 'sailSelection': return sailFeedback;
      case 'tactics': return tacticsFeedback;
      default: return {};
    }
  };

  // Submit feedback
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const feedback: MorningChecklistFeedback = {
        raceEventId,
        overallRating,
        overallNotes: overallNotes || undefined,
        submittedAt: new Date().toISOString(),
      };

      // Add section feedback if there's any data
      if (forecastFeedback.effectiveness) {
        feedback.forecast = {
          effectiveness: forecastFeedback.effectiveness,
          whatWorked: forecastFeedback.whatWorked || '',
          whatToChange: forecastFeedback.whatToChange || '',
          forecastAccuracy: forecastFeedback.effectiveness, // Use same rating for now
        };
      }
      if (rigFeedback.effectiveness) {
        feedback.rigTuning = {
          effectiveness: rigFeedback.effectiveness,
          whatWorked: rigFeedback.whatWorked || '',
          whatToChange: rigFeedback.whatToChange || '',
        };
      }
      if (sailFeedback.effectiveness) {
        feedback.sailSelection = {
          effectiveness: sailFeedback.effectiveness,
          whatWorked: sailFeedback.whatWorked || '',
          whatToChange: sailFeedback.whatToChange || '',
        };
      }
      if (tacticsFeedback.effectiveness) {
        feedback.tactics = {
          effectiveness: tacticsFeedback.effectiveness,
          whatWorked: tacticsFeedback.whatWorked || '',
          whatToChange: tacticsFeedback.whatToChange || '',
        };
      }

      // Save to database
      const { error } = await supabase
        .from('sailor_race_preparation')
        .update({
          morning_feedback: feedback,
          updated_at: new Date().toISOString(),
        })
        .eq('race_event_id', raceEventId);

      if (error) throw error;

      // Trigger adaptive learning extraction in background (don't await)
      // Collect all "whatWorked" and "whatToChange" text for learning
      const hasFeedbackText = [
        forecastFeedback.whatWorked, forecastFeedback.whatToChange,
        rigFeedback.whatWorked, rigFeedback.whatToChange,
        sailFeedback.whatWorked, sailFeedback.whatToChange,
        tacticsFeedback.whatWorked, tacticsFeedback.whatToChange,
        overallNotes,
      ].some(text => text?.trim());

      if (user?.id && hasFeedbackText) {
        const phaseNotes = [];

        if (forecastFeedback.whatWorked?.trim() || forecastFeedback.whatToChange?.trim()) {
          phaseNotes.push({
            phase: 'prep' as const,
            notes: [
              forecastFeedback.whatWorked ? `What worked (forecast): ${forecastFeedback.whatWorked}` : '',
              forecastFeedback.whatToChange ? `What to change (forecast): ${forecastFeedback.whatToChange}` : '',
            ].filter(Boolean).join('. '),
          });
        }

        if (rigFeedback.whatWorked?.trim() || rigFeedback.whatToChange?.trim()) {
          phaseNotes.push({
            phase: 'prep' as const,
            notes: [
              rigFeedback.whatWorked ? `What worked (rig): ${rigFeedback.whatWorked}` : '',
              rigFeedback.whatToChange ? `What to change (rig): ${rigFeedback.whatToChange}` : '',
            ].filter(Boolean).join('. '),
          });
        }

        if (sailFeedback.whatWorked?.trim() || sailFeedback.whatToChange?.trim()) {
          phaseNotes.push({
            phase: 'prep' as const,
            notes: [
              sailFeedback.whatWorked ? `What worked (sails): ${sailFeedback.whatWorked}` : '',
              sailFeedback.whatToChange ? `What to change (sails): ${sailFeedback.whatToChange}` : '',
            ].filter(Boolean).join('. '),
          });
        }

        if (tacticsFeedback.whatWorked?.trim() || tacticsFeedback.whatToChange?.trim()) {
          phaseNotes.push({
            phase: 'race' as const,
            notes: [
              tacticsFeedback.whatWorked ? `What worked (tactics): ${tacticsFeedback.whatWorked}` : '',
              tacticsFeedback.whatToChange ? `What to change (tactics): ${tacticsFeedback.whatToChange}` : '',
            ].filter(Boolean).join('. '),
          });
        }

        if (phaseNotes.length > 0 || overallNotes?.trim()) {
          AdaptiveLearningService.processRaceCompletion(
            user.id,
            raceEventId,
            {
              narrative: overallNotes || undefined,
              phaseNotes: phaseNotes.length > 0 ? phaseNotes : undefined,
            }
          ).catch(err => {
            logger.warn('Failed to extract learning events from morning review (non-critical):', err);
          });
        }
      }

      logger.debug('Saved morning checklist feedback', { raceEventId });
      onComplete();
    } catch (err) {
      logger.error('Error saving feedback:', err);
      // Complete anyway to not block the flow
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={IOS_COLORS.gray} />
        <Text style={styles.loadingText}>Loading decisions...</Text>
      </View>
    );
  }

  // No morning intentions - skip this step
  if (!intentions || sectionsWithData.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Morning Decisions</Text>
        <Text style={styles.subtitle}>
          How did your pre-race plans work out?
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Per-section feedback */}
        {sectionsWithData.map((section) => (
          <DecisionFeedbackSection
            key={section.id}
            section={section}
            feedback={getFeedbackForSection(section.id)}
            onFeedbackChange={(field, value) => handleFeedbackChange(section.id, field, value)}
            isExpanded={expandedSection === section.id}
            onToggleExpand={() => setExpandedSection(
              expandedSection === section.id ? null : section.id
            )}
          />
        ))}

        {/* Overall rating */}
        <View style={styles.overallSection}>
          <Text style={styles.overallLabel}>Overall prep effectiveness</Text>
          <StarRating
            value={overallRating}
            onChange={setOverallRating}
          />
          <TextInput
            style={styles.overallNotesInput}
            value={overallNotes}
            onChangeText={setOverallNotes}
            placeholder="Any overall thoughts..."
            placeholderTextColor={IOS_COLORS.gray3}
            multiline
            numberOfLines={2}
          />
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={IOS_COLORS.systemBackground} />
          ) : (
            <Text style={styles.submitButtonText}>Save Feedback</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          disabled={isSubmitting}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Decision section
  decisionSection: {
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  decisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  decisionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  decisionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  decisionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  miniRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniRatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  tapToRate: {
    fontSize: 12,
    color: IOS_COLORS.gray,
  },
  decisionContent: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },

  // Pre-race notes
  preRaceNotes: {
    padding: 12,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 8,
  },
  preRaceNotesLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: IOS_COLORS.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preRaceNotesText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
  },

  // Rating
  ratingRow: {
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },

  // Feedback fields
  feedbackField: {
    gap: 4,
  },
  feedbackFieldLabel: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
  },
  feedbackInput: {
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 8,
    padding: 12,
    minHeight: 40,
  },

  // Overall section
  overallSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: IOS_COLORS.secondarySystemBackground,
    borderRadius: 12,
    gap: 12,
  },
  overallLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  overallNotesInput: {
    fontSize: 15,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
  },

  // Actions
  actions: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  submitButton: {
    backgroundColor: IOS_COLORS.label,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.systemBackground,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 15,
    color: IOS_COLORS.gray,
  },
});

export default MorningDecisionsReview;
