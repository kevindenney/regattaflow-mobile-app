/**
 * PlanTab — 4 guided planning questions for a step.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { PlanQuestionCard } from './PlanQuestionCard';
import { SubStepEditor } from './SubStepEditor';
import { ResourcePicker } from '@/components/library/ResourcePicker';
import { ResourceTypeIcon } from '@/components/library/ResourceTypeIcon';
import { getResourcesByIds } from '@/services/LibraryService';
import { CrossInterestSuggestions } from './CrossInterestSuggestions';
import { DateEnrichmentCard } from './DateEnrichmentCard';
import { createStep } from '@/services/TimelineStepService';
import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import type { StepPlanData, SubStep, CrossInterestSuggestion } from '@/types/step-detail';
import type { LibraryResourceRecord } from '@/types/library';
import { Linking } from 'react-native';

interface PlanTabProps {
  stepId?: string;
  planData: StepPlanData;
  interestId: string | undefined;
  onUpdate: (data: Partial<StepPlanData>) => void;
  onNextTab?: () => void;
  readOnly?: boolean;
}

export function PlanTab({ stepId, planData, interestId, onUpdate, onNextTab, readOnly }: PlanTabProps) {
  const { user } = useAuth();
  const { userInterests } = useInterest();
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [linkedResources, setLinkedResources] = useState<LibraryResourceRecord[]>([]);

  // Load linked resources on mount and when IDs change
  const linkedIds = planData.linked_resource_ids ?? [];
  useEffect(() => {
    if (linkedIds.length === 0) {
      setLinkedResources([]);
      return;
    }
    getResourcesByIds(linkedIds).then(setLinkedResources).catch(() => {});
  }, [linkedIds.join(',')]);

  const handleSelectResources = useCallback((resources: LibraryResourceRecord[]) => {
    const newIds = resources.map((r) => r.id);
    const existingIds = planData.linked_resource_ids ?? [];
    const mergedIds = [...new Set([...existingIds, ...newIds])];
    onUpdate({ linked_resource_ids: mergedIds });
    setShowResourcePicker(false);
  }, [planData.linked_resource_ids, onUpdate]);

  const handleRemoveResource = useCallback((resourceId: string) => {
    const updated = (planData.linked_resource_ids ?? []).filter((id) => id !== resourceId);
    onUpdate({ linked_resource_ids: updated });
  }, [planData.linked_resource_ids, onUpdate]);

  const handleSubStepsChange = useCallback((subSteps: SubStep[]) => {
    onUpdate({ how_sub_steps: subSteps });
  }, [onUpdate]);

  const q1Complete = Boolean(planData.what_will_you_do?.trim() || linkedIds.length > 0);
  const q2Complete = Boolean(planData.how_sub_steps?.length && planData.how_sub_steps.some((s) => s.text.trim()));
  const q3Complete = Boolean(planData.why_reasoning?.trim());
  const q4Complete = Boolean(planData.who_collaborators?.length && planData.who_collaborators.some((c) => c.trim()));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Q1: What will you do? */}
      <PlanQuestionCard
        icon="bulb-outline"
        title="What will you do?"
        isComplete={q1Complete}
        defaultExpanded={!q1Complete}
      >
        <TextInput
          style={[styles.textArea, readOnly && styles.readOnlyInput]}
          value={planData.what_will_you_do ?? ''}
          onChangeText={readOnly ? undefined : (text) => onUpdate({ what_will_you_do: text })}
          placeholder={readOnly ? '' : "Describe what you'll focus on..."}
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          multiline
          textAlignVertical="top"
          editable={!readOnly}
        />

        {/* Linked resources chips */}
        {linkedResources.length > 0 && (
          <View style={styles.chipContainer}>
            {linkedResources.map((resource) => (
              <Pressable
                key={resource.id}
                style={styles.resourceChip}
                onPress={() => {
                  if (resource.url) Linking.openURL(resource.url);
                }}
              >
                <ResourceTypeIcon type={resource.resource_type} size={14} />
                <Text style={styles.chipText} numberOfLines={1}>{resource.title}</Text>
                {!readOnly && (
                  <Pressable
                    onPress={() => handleRemoveResource(resource.id)}
                    hitSlop={6}
                  >
                    <Ionicons name="close-circle" size={16} color={IOS_COLORS.systemGray3} />
                  </Pressable>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {!readOnly && (
          <Pressable
            style={styles.addLibraryButton}
            onPress={() => setShowResourcePicker(true)}
          >
            <Ionicons name="library-outline" size={18} color={STEP_COLORS.accent} />
            <Text style={styles.addLibraryText}>Add from Library</Text>
          </Pressable>
        )}
      </PlanQuestionCard>

      {/* Q2: How will you do it? */}
      <PlanQuestionCard
        icon="list-outline"
        title="How will you do it?"
        isComplete={q2Complete}
        defaultExpanded={q1Complete && !q2Complete}
      >
        <SubStepEditor
          subSteps={planData.how_sub_steps ?? []}
          onChange={readOnly ? () => {} : handleSubStepsChange}
          readOnly={readOnly}
        />
      </PlanQuestionCard>

      {/* Q3: Why is this next? */}
      <PlanQuestionCard
        icon="help-circle-outline"
        title="Why is this next?"
        isComplete={q3Complete}
      >
        <TextInput
          style={[styles.textArea, readOnly && styles.readOnlyInput]}
          value={planData.why_reasoning ?? ''}
          onChangeText={readOnly ? undefined : (text) => onUpdate({ why_reasoning: text })}
          placeholder={readOnly ? '' : "What makes this the right next step?"}
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          multiline
          textAlignVertical="top"
          editable={!readOnly}
        />
      </PlanQuestionCard>

      {/* Q4: Who will you do this with? */}
      <PlanQuestionCard
        icon="people-outline"
        title="Who will you do this with?"
        isComplete={q4Complete}
      >
        <TextInput
          style={[styles.textArea, readOnly && styles.readOnlyInput]}
          value={(planData.who_collaborators ?? []).join('\n')}
          onChangeText={readOnly ? undefined : (text) => {
            const names = text.split('\n');
            onUpdate({ who_collaborators: names });
          }}
          placeholder={readOnly ? '' : "List people (one per line)..."}
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          multiline
          textAlignVertical="top"
          editable={!readOnly}
        />
      </PlanQuestionCard>

      {/* Conditions card (wind, tide, rig/sail) */}
      {planData.date_enrichment && (
        <View style={styles.conditionsContainer}>
          <DateEnrichmentCard
            dateLabel={planData.date_enrichment.wind || planData.date_enrichment.tide ? 'this session' : 'session'}
            dateIso=""
            enrichment={planData.date_enrichment}
          />
        </View>
      )}

      {/* Cross-interest suggestions */}
      {stepId && !readOnly && (
        <CrossInterestSuggestions
          stepId={stepId}
          interestId={interestId}
          onApplyToStep={(text) => {
            // Add the suggestion as a sub-step so it's visible in "How will you do it?"
            const existing = planData.how_sub_steps ?? [];
            const newSubStep: SubStep = {
              id: `cross_${Date.now()}`,
              text,
              sort_order: existing.length,
              completed: false,
            };
            onUpdate({ how_sub_steps: [...existing, newSubStep] });
          }}
          onCreateStep={async (suggestion) => {
            if (!user?.id) return;
            const targetInterest = userInterests.find((i) => i.slug === suggestion.sourceInterestSlug);
            if (!targetInterest) return;
            try {
              const created = await createStep({
                user_id: user.id,
                interest_id: targetInterest.id,
                title: suggestion.suggestion.slice(0, 80),
                status: 'pending',
                source_type: 'manual',
                metadata: { plan: { what_will_you_do: suggestion.suggestion } },
              });
              router.push(`/step/${created.id}` as any);
            } catch {}
          }}
        />
      )}

      {/* Next tab CTA */}
      {onNextTab && !readOnly && (
        <View style={styles.nextCtaContainer}>
          <Pressable style={styles.nextCtaButton} onPress={onNextTab}>
            <Text style={styles.nextCtaText}>Next: Start Doing</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {/* Resource picker modal */}
      {!readOnly && (
        <ResourcePicker
          visible={showResourcePicker}
          interestId={interestId}
          onSelect={handleSelectResources}
          onClose={() => setShowResourcePicker(false)}
          excludeIds={linkedIds}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: IOS_SPACING.md,
    paddingBottom: 100,
  },
  textArea: {
    fontSize: 14,
    color: STEP_COLORS.label,
    backgroundColor: STEP_COLORS.pageBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: STEP_COLORS.border,
    padding: IOS_SPACING.sm,
    minHeight: 80,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        resize: 'vertical',
      } as any,
    }),
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.xs,
    marginTop: IOS_SPACING.sm,
  },
  resourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 13,
    color: IOS_COLORS.label,
    fontWeight: '500',
    flexShrink: 1,
  },
  addLibraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    marginTop: IOS_SPACING.sm,
    paddingVertical: IOS_SPACING.xs,
  },
  addLibraryText: {
    fontSize: 14,
    fontWeight: '500',
    color: STEP_COLORS.accent,
  },
  nextCtaContainer: {
    marginTop: IOS_SPACING.md,
    paddingTop: IOS_SPACING.sm,
  },
  nextCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: STEP_COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(61,138,90,0.25)' } as any,
      default: {
        shadowColor: STEP_COLORS.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  nextCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  conditionsContainer: {
    marginTop: IOS_SPACING.sm,
  },
  readOnlyInput: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: STEP_COLORS.secondaryLabel,
  },
});
