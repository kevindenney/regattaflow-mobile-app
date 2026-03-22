/**
 * StepPlanQuestions — 4 guided planning questions embedded in the card view.
 * Renders above the config-driven phase tiles on the Plan tab.
 *
 * Uses local state for all text inputs to avoid cursor jumps / keystroke loss
 * caused by React Query refetches. Local state syncs FROM server on mount and
 * syncs TO server via debounced mutations.
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Platform, Linking, Share } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { PlanQuestionCard } from './PlanQuestionCard';
import { SubStepEditor } from './SubStepEditor';
import { CollaboratorPicker } from './CollaboratorPicker';
import { CourseContextSheet } from './CourseContextSheet';
import { ResourcePicker } from '@/components/library/ResourcePicker';
import { ResourceTypeIcon } from '@/components/library/ResourceTypeIcon';
import { useStepDetail, useUpdateStepMetadata } from '@/hooks/useStepDetail';
import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import { getResourcesByIds } from '@/services/LibraryService';
import { NotificationService } from '@/services/NotificationService';
import { gatherEnrichedContext, generatePlanFromResource } from '@/services/ai/StepPlanAIService';
import { getCompetencies } from '@/services/competencyService';
import { getSkillGoalTitles } from '@/services/SkillGoalService';
import type { StepPlanData, StepMetadata, SubStep, StepCollaborator } from '@/types/step-detail';
// WhatChatPanel removed — brain dump entry replaces inline AI chat
import { CrossInterestSuggestions } from './CrossInterestSuggestions';
import { DateEnrichmentCard } from './DateEnrichmentCard';
import { createStep, enableStepSharing } from '@/services/TimelineStepService';
import type { LibraryResourceRecord } from '@/types/library';

interface StepPlanQuestionsProps {
  stepId: string;
  interestId: string | undefined;
  readOnly?: boolean;
}

export function StepPlanQuestions({ stepId, interestId, readOnly }: StepPlanQuestionsProps) {
  const { data: step } = useStepDetail(stepId);
  const updateMetadata = useUpdateStepMetadata(stepId);
  const { user } = useAuth();
  const { currentInterest, userInterests } = useInterest();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [linkedResources, setLinkedResources] = useState<LibraryResourceRecord[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [localGoals, setLocalGoals] = useState<string[]>([]);
  const [newGoalText, setNewGoalText] = useState('');
  const [suggestedCompetencies, setSuggestedCompetencies] = useState<string[]>([]);
  const [suggestedUserSkills, setSuggestedUserSkills] = useState<string[]>([]);
  const autoMatchedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Local state for text inputs — prevents cursor jumps from query refetches
  // ---------------------------------------------------------------------------
  const [localWhat, setLocalWhat] = useState('');
  const [localWhy, setLocalWhy] = useState('');
  const [localCollaborators, setLocalCollaborators] = useState<StepCollaborator[]>([]);
  const [localConnectionSpace, setLocalConnectionSpace] = useState('');
  const [showCollaboratorPicker, setShowCollaboratorPicker] = useState(false);
  const [showCourseContext, setShowCourseContext] = useState(false);
  const initializedRef = useRef(false);

  const metadata = (step?.metadata ?? {}) as StepMetadata;
  const planData: StepPlanData = metadata.plan ?? {};

  // Seed local state from server data once on first load
  useEffect(() => {
    if (step && !initializedRef.current) {
      const plan = (step.metadata as StepMetadata)?.plan ?? {};
      setLocalWhat(plan.what_will_you_do ?? '');
      setLocalWhy(plan.why_reasoning ?? '');
      setLocalConnectionSpace(plan.connection_space ?? '');
      // Migrate legacy who_collaborators to structured collaborators
      if (plan.collaborators?.length) {
        setLocalCollaborators(plan.collaborators);
      } else if (plan.who_collaborators?.length) {
        setLocalCollaborators(
          plan.who_collaborators
            .filter((name) => name.trim())
            .map((name, i) => ({
              id: `legacy_${i}_${Date.now()}`,
              type: 'external' as const,
              display_name: name.trim(),
            }))
        );
      }
      setLocalGoals(plan.capability_goals ?? []);
      initializedRef.current = true;
    }
  }, [step]);

  // Load org competencies + user skill goals as suggestions for capability goals
  useEffect(() => {
    const resolvedId = interestId || currentInterest?.id;
    if (!resolvedId) return;

    const loadSuggestions = async () => {
      const orgTitles: string[] = [];
      const userTitles: string[] = [];

      // Org competencies
      try {
        const comps = await getCompetencies(resolvedId);
        comps.forEach((c) => c.title && orgTitles.push(c.title));
      } catch {}

      // User skill goals
      if (user?.id) {
        try {
          const goals = await getSkillGoalTitles(user.id, resolvedId);
          goals.forEach((t) => userTitles.push(t));
        } catch {}
      }

      setSuggestedCompetencies(orgTitles);
      setSuggestedUserSkills(userTitles);
    };

    loadSuggestions();
  }, [interestId, currentInterest?.id, user?.id]);

  // Use a ref for the latest planData so debounced saves always merge with current server state
  const planDataRef = useRef(planData);
  planDataRef.current = planData;

  // Debounced save — reads planDataRef.current at fire time, not at schedule time
  const debouncedSave = useCallback((partial: Partial<StepPlanData>) => {
    if (readOnly) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateMetadata.mutate({ plan: { ...planDataRef.current, ...partial } });
    }, 800);
  }, [updateMetadata, readOnly]);

  // Auto-attach relevant Reflect skills when step has a description but no goals yet
  useEffect(() => {
    if (autoMatchedRef.current) return;
    if (suggestedUserSkills.length === 0) return;
    if (localGoals.length > 0) {
      autoMatchedRef.current = true;
      return;
    }
    // Need a description to match against
    const description = (localWhat || step?.title || '').toLowerCase();
    if (!description.trim()) return;

    // Tokenize: extract meaningful words (3+ chars) from the step description
    const descWords = description
      .split(/[\s,.\-—/()]+/)
      .filter((w) => w.length >= 3)
      .map((w) => w.replace(/s$/, '')); // rough singularize

    // Score each skill by keyword overlap
    const scored = suggestedUserSkills
      .map((skill) => {
        const skillWords = skill
          .toLowerCase()
          .split(/[\s,.\-—/()]+/)
          .filter((w) => w.length >= 3)
          .map((w) => w.replace(/s$/, ''));
        const matches = skillWords.filter((sw) =>
          descWords.some((dw) => sw.includes(dw) || dw.includes(sw)),
        );
        return { skill, score: matches.length };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      const matched = scored.map((s) => s.skill);
      setLocalGoals(matched);
      debouncedSave({ capability_goals: matched });
    }

    autoMatchedRef.current = true;
  }, [suggestedUserSkills, localWhat, step?.title, localGoals.length, debouncedSave]);

  // Load linked resources
  const linkedIds = planData.linked_resource_ids ?? [];
  useEffect(() => {
    if (linkedIds.length === 0) {
      setLinkedResources([]);
      return;
    }
    getResourcesByIds(linkedIds).then(setLinkedResources).catch(() => {});
  }, [linkedIds.join(',')]);

  const handleWhatChange = useCallback((text: string) => {
    setLocalWhat(text);
    debouncedSave({ what_will_you_do: text });
  }, [debouncedSave]);

  const handleWhyChange = useCallback((text: string) => {
    setLocalWhy(text);
    debouncedSave({ why_reasoning: text });
  }, [debouncedSave]);

  const handleAddCollaborator = useCallback((collaborator: StepCollaborator) => {
    setLocalCollaborators((prev) => {
      // Prevent duplicates
      if (prev.some((c) => c.id === collaborator.id)) return prev;
      if (collaborator.user_id && prev.some((c) => c.user_id === collaborator.user_id)) return prev;
      const updated = [...prev, collaborator];
      debouncedSave({
        collaborators: updated,
        who_collaborators: updated.map((c) => c.display_name),
      });
      // Send notification for platform users
      if (collaborator.type === 'platform' && collaborator.user_id && user?.id && step) {
        const userName = (user as any).user_metadata?.full_name || (user as any).email || 'Someone';
        NotificationService.notifyStepCollaboratorAdded({
          targetUserId: collaborator.user_id,
          actorId: user.id,
          actorName: userName,
          stepId: step.id,
          stepTitle: step.title,
        }).catch(() => {});
      }
      return updated;
    });
  }, [debouncedSave, user, step]);

  const handleRemoveCollaborator = useCallback((collaboratorId: string) => {
    setLocalCollaborators((prev) => {
      const updated = prev.filter((c) => c.id !== collaboratorId);
      debouncedSave({
        collaborators: updated,
        who_collaborators: updated.map((c) => c.display_name),
      });
      return updated;
    });
  }, [debouncedSave]);

  const handleShareWithCollaborator = useCallback(async (collaboratorName: string) => {
    if (!step) return;
    try {
      const { url } = await enableStepSharing(step.id);
      const message = `Hey ${collaboratorName}, here's our plan for "${step.title}": ${url}`;
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: step.title, text: message, url });
        } else {
          await navigator.clipboard.writeText(url);
        }
      } else {
        await Share.share({ message, url });
      }
    } catch (err) {
      console.error('Failed to share with collaborator:', err);
    }
  }, [step]);

  const handleConnectionSpaceChange = useCallback((text: string) => {
    setLocalConnectionSpace(text);
    debouncedSave({ connection_space: text });
  }, [debouncedSave]);

  const handleSelectResources = useCallback(async (resources: LibraryResourceRecord[]) => {
    const newIds = resources.map((r) => r.id);
    const existingIds = planDataRef.current.linked_resource_ids ?? [];
    const mergedIds = [...new Set([...existingIds, ...newIds])];
    debouncedSave({ linked_resource_ids: mergedIds });
    setShowResourcePicker(false);

    // If plan fields are mostly empty, auto-generate from the first new resource
    const currentPlan = planDataRef.current;
    const hasWhat = Boolean(currentPlan.what_will_you_do?.trim());
    const hasSubSteps = Boolean(currentPlan.how_sub_steps?.length && currentPlan.how_sub_steps.some((s) => s.text.trim()));
    const firstNew = resources[0];

    if (!hasWhat && !hasSubSteps && firstNew) {
      setAiLoading(true);
      try {
        const resolvedInterestId = interestId || currentInterest?.id;
        const enriched = resolvedInterestId && user?.id
          ? await gatherEnrichedContext(user.id, resolvedInterestId)
          : { stepHistory: [], orgCompetencies: [], followedUsersActivity: [], orgPrograms: [], userCapabilityProgress: [] };

        const plan = await generatePlanFromResource({
          resource: firstNew,
          interestName: currentInterest?.name || 'this interest',
          stepHistory: enriched.stepHistory,
          existingSkillGoals: suggestedUserSkills,
        });

        // Populate the plan fields
        if (plan.what_will_you_do) {
          setLocalWhat(plan.what_will_you_do);
          debouncedSave({ what_will_you_do: plan.what_will_you_do });
        }
        if (plan.how_sub_steps.length) {
          const subSteps: SubStep[] = plan.how_sub_steps.map((text, idx) => ({
            id: `sub-${Date.now()}-${idx}`,
            text,
            sort_order: idx,
            completed: false,
          }));
          debouncedSave({ how_sub_steps: subSteps });
        }
        if (plan.why_reasoning) {
          setLocalWhy(plan.why_reasoning);
          debouncedSave({ why_reasoning: plan.why_reasoning });
        }
        if (plan.capability_goals.length) {
          setLocalGoals((prev) => {
            const merged = [...new Set([...prev, ...plan.capability_goals])];
            debouncedSave({ capability_goals: merged });
            return merged;
          });
        }
      } catch (err) {
        console.error('Auto-plan from resource failed:', err);
      } finally {
        setAiLoading(false);
      }
    }
  }, [debouncedSave, interestId, currentInterest, user?.id]);

  const handleRemoveResource = useCallback((resourceId: string) => {
    const updated = (planDataRef.current.linked_resource_ids ?? []).filter((id) => id !== resourceId);
    debouncedSave({ linked_resource_ids: updated });
  }, [debouncedSave]);

  const handleSubStepsChange = useCallback((subSteps: SubStep[]) => {
    debouncedSave({ how_sub_steps: subSteps });
  }, [debouncedSave]);

  const handleAddGoal = useCallback((goalText: string) => {
    const trimmed = goalText.trim();
    if (!trimmed) return;
    setLocalGoals((prev) => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      debouncedSave({ capability_goals: updated });
      return updated;
    });
    setNewGoalText('');
  }, [debouncedSave]);

  const handleRemoveGoal = useCallback((goal: string) => {
    setLocalGoals((prev) => {
      const updated = prev.filter((g) => g !== goal);
      debouncedSave({ capability_goals: updated });
      return updated;
    });
  }, [debouncedSave]);

  const q1Complete = Boolean(localWhat.trim() || linkedIds.length > 0);
  const q2Complete = Boolean(planData.how_sub_steps?.length && planData.how_sub_steps.some((s) => s.text.trim()));
  const q3Complete = Boolean(localWhy.trim());
  const q4Complete = localCollaborators.length > 0;
  const q5Complete = localGoals.length > 0;

  // Build a set of already-added collaborator identifiers for the picker
  const collaboratorExistingIds = useMemo(() => {
    const ids = new Set<string>();
    localCollaborators.forEach((c) => {
      ids.add(c.id);
      if (c.user_id) ids.add(c.user_id);
    });
    return ids;
  }, [localCollaborators]);

  // Filter suggestions to only show ones not already added
  const availableOrgSuggestions = suggestedCompetencies.filter((s) => !localGoals.includes(s));
  const availableSkillSuggestions = suggestedUserSkills.filter((s) => !localGoals.includes(s) && !suggestedCompetencies.includes(s));

  if (!step) return null;

  // Course context (if this step was created from a course)
  const courseCtx = (metadata as any)?.course_context as
    | { resource_id: string; course_title?: string; author_or_creator?: string; lesson_id?: string; lesson_index?: number; total_lessons?: number }
    | undefined;

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>STEP PLANNING</Text>
        <Text style={styles.sectionSubtitle}>Define what, how, and why</Text>
      </View>

      {/* Course context banner — tap to see full course */}
      {courseCtx && courseCtx.course_title && (
        <Pressable
          style={styles.courseContextBanner}
          onPress={() => setShowCourseContext(true)}
        >
          <Ionicons name="school-outline" size={16} color={IOS_COLORS.systemPurple} />
          <Text style={styles.courseContextText}>
            Lesson {(courseCtx.lesson_index ?? 0) + 1} of {courseCtx.total_lessons ?? '?'} in{' '}
            {courseCtx.author_or_creator ? `${courseCtx.author_or_creator}'s ` : ''}
            {courseCtx.course_title}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={IOS_COLORS.systemPurple} />
        </Pressable>
      )}

      {/* Course context sheet */}
      {courseCtx && courseCtx.resource_id && (
        <CourseContextSheet
          visible={showCourseContext}
          onClose={() => setShowCourseContext(false)}
          courseContext={courseCtx as { resource_id: string; course_title: string; author_or_creator?: string; lesson_id?: string; lesson_index?: number; total_lessons?: number }}
        />
      )}

      {/* Q1: What will you do? */}
      <PlanQuestionCard
        icon="bulb-outline"
        title="What will you do?"
        isComplete={q1Complete}
        defaultExpanded={!q1Complete}
      >
        <TextInput
          style={[styles.textArea, readOnly && styles.readOnlyInput]}
          value={localWhat}
          onChangeText={readOnly ? undefined : handleWhatChange}
          placeholder={readOnly ? '' : "Describe what you'll focus on..."}
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          multiline
          textAlignVertical="top"
          editable={!readOnly}
        />

        {linkedResources.length > 0 && (
          <View style={styles.chipContainer}>
            {linkedResources.map((resource) => (
              <Pressable
                key={resource.id}
                style={styles.resourceChip}
                onPress={() => { if (resource.url) Linking.openURL(resource.url); }}
              >
                <ResourceTypeIcon type={resource.resource_type} size={14} />
                <Text style={styles.chipText} numberOfLines={1}>{resource.title}</Text>
                {!readOnly && (
                  <Pressable onPress={() => handleRemoveResource(resource.id)} hitSlop={6}>
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
          value={localWhy}
          onChangeText={readOnly ? undefined : handleWhyChange}
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
        {/* Collaborator chips */}
        {localCollaborators.length > 0 && (
          <View style={styles.collaboratorChipContainer}>
            {localCollaborators.map((collab) => (
              <View
                key={collab.id}
                style={[
                  styles.collaboratorChip,
                  collab.type === 'platform' ? styles.collaboratorChipPlatform : styles.collaboratorChipExternal,
                ]}
              >
                {collab.type === 'platform' ? (
                  collab.avatar_emoji ? (
                    <Text style={styles.collaboratorChipEmoji}>{collab.avatar_emoji}</Text>
                  ) : (
                    <Ionicons name="person" size={14} color={STEP_COLORS.accent} />
                  )
                ) : (
                  <Ionicons name="person-outline" size={14} color={IOS_COLORS.secondaryLabel} />
                )}
                <Text
                  style={[
                    styles.collaboratorChipText,
                    collab.type === 'platform' ? styles.collaboratorChipTextPlatform : styles.collaboratorChipTextExternal,
                  ]}
                  numberOfLines={1}
                >
                  {collab.display_name}
                </Text>
                {collab.type === 'external' && !readOnly && (
                  <Pressable
                    onPress={() => handleShareWithCollaborator(collab.display_name)}
                    hitSlop={6}
                    style={styles.sendLinkButton}
                  >
                    <Ionicons name="send-outline" size={13} color={STEP_COLORS.accent} />
                  </Pressable>
                )}
                {!readOnly && (
                  <Pressable onPress={() => handleRemoveCollaborator(collab.id)} hitSlop={6}>
                    <Ionicons name="close-circle" size={16} color={IOS_COLORS.systemGray3} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Add people button */}
        {!readOnly && (
          <Pressable
            style={styles.addPeopleButton}
            onPress={() => setShowCollaboratorPicker(true)}
          >
            <Ionicons name="person-add-outline" size={18} color={STEP_COLORS.accent} />
            <Text style={styles.addPeopleText}>Add people</Text>
          </Pressable>
        )}

        {/* Connection space */}
        <TextInput
          style={[styles.connectionSpaceInput, readOnly && styles.readOnlyInput]}
          value={localConnectionSpace}
          onChangeText={readOnly ? undefined : handleConnectionSpaceChange}
          placeholder={readOnly ? '' : "Where will you connect? (Discord, Zoom, in person...)"}
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          editable={!readOnly}
        />
      </PlanQuestionCard>

      {/* Collaborator picker modal */}
      {!readOnly && (
        <CollaboratorPicker
          visible={showCollaboratorPicker}
          onClose={() => setShowCollaboratorPicker(false)}
          onAdd={handleAddCollaborator}
          existingIds={collaboratorExistingIds}
        />
      )}

      {/* Q5: What skills are you developing? */}
      <PlanQuestionCard
        icon="trophy-outline"
        title="What skills are you developing?"
        isComplete={q5Complete}
      >
        {/* Current goals as chips */}
        {localGoals.length > 0 && (
          <View style={styles.goalChipContainer}>
            {localGoals.map((goal) => (
              <View key={goal} style={styles.goalChip}>
                <Text style={styles.goalChipText} numberOfLines={1}>{goal}</Text>
                {!readOnly && (
                  <Pressable onPress={() => handleRemoveGoal(goal)} hitSlop={6}>
                    <Ionicons name="close-circle" size={16} color={IOS_COLORS.systemGray3} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        {!readOnly && (
          <>
            {/* Add custom goal */}
            <View style={styles.addGoalRow}>
              <TextInput
                style={styles.addGoalInput}
                value={newGoalText}
                onChangeText={setNewGoalText}
                onSubmitEditing={() => handleAddGoal(newGoalText)}
                placeholder="Type a skill to track..."
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                returnKeyType="done"
              />
              <Pressable
                style={[styles.addGoalButton, !newGoalText.trim() && styles.addGoalButtonDisabled]}
                onPress={() => handleAddGoal(newGoalText)}
                disabled={!newGoalText.trim()}
              >
                <Ionicons name="add" size={20} color={newGoalText.trim() ? '#FFFFFF' : IOS_COLORS.systemGray3} />
              </Pressable>
            </View>

            {/* Suggestions from user's Reflect skills */}
            {availableSkillSuggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsLabel}>From your skills:</Text>
                <View style={styles.suggestionsWrap}>
                  {availableSkillSuggestions.slice(0, 8).map((skill) => (
                    <Pressable
                      key={skill}
                      style={styles.suggestionChip}
                      onPress={() => handleAddGoal(skill)}
                    >
                      <Ionicons name="add-circle-outline" size={14} color={STEP_COLORS.accent} />
                      <Text style={styles.suggestionChipText} numberOfLines={1}>{skill}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Suggestions from org competencies */}
            {availableOrgSuggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsLabel}>From your organization:</Text>
                <View style={styles.suggestionsWrap}>
                  {availableOrgSuggestions.slice(0, 8).map((comp) => (
                    <Pressable
                      key={comp}
                      style={styles.suggestionChip}
                      onPress={() => handleAddGoal(comp)}
                    >
                      <Ionicons name="add-circle-outline" size={14} color={STEP_COLORS.accent} />
                      <Text style={styles.suggestionChipText} numberOfLines={1}>{comp}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {localGoals.length === 0 && availableSkillSuggestions.length === 0 && availableOrgSuggestions.length === 0 && (
              <Text style={styles.goalHint}>
                Add skills you want to improve. You'll rate your progress during review.
              </Text>
            )}
          </>
        )}
      </PlanQuestionCard>

      {/* Conditions card (wind, tide, rig/sail) */}
      {planData.date_enrichment && (planData.date_enrichment.wind || planData.date_enrichment.tide || planData.date_enrichment.rig_suggestion || planData.date_enrichment.sail_suggestion) && (
        <View style={styles.conditionsContainer}>
          <DateEnrichmentCard
            dateLabel="this session"
            dateIso=""
            enrichment={planData.date_enrichment}
          />
        </View>
      )}

      {/* Cross-interest suggestions */}
      {!readOnly && <CrossInterestSuggestions
        stepId={stepId}
        interestId={interestId}
        onApplyToStep={(text) => {
          // Add the suggestion as a sub-step so it's visible in "How will you do it?"
          const existing = planDataRef.current.how_sub_steps ?? [];
          const newSubStep: SubStep = {
            id: `cross_${Date.now()}`,
            text,
            sort_order: existing.length,
            completed: false,
          };
          const updated = [...existing, newSubStep];
          debouncedSave({ how_sub_steps: updated });
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
      />}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: IOS_SPACING.md,
    paddingBottom: IOS_SPACING.md,
  },
  sectionHeader: {
    marginBottom: IOS_SPACING.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    marginTop: 2,
  },
  courseContextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(175,82,222,0.08)',
    borderRadius: 10,
    padding: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.sm,
  },
  courseContextText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.systemPurple,
    lineHeight: 18,
  },
  textArea: {
    fontSize: 14,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray4,
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
    paddingVertical: IOS_SPACING.xs,
  },
  addLibraryText: {
    fontSize: 14,
    fontWeight: '500',
    color: STEP_COLORS.accent,
  },
  goalChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.xs,
    marginBottom: IOS_SPACING.sm,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,149,0,0.1)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  goalChipText: {
    fontSize: 13,
    color: IOS_COLORS.systemOrange,
    fontWeight: '600',
    flexShrink: 1,
  },
  addGoalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
  },
  addGoalInput: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray4,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 8,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  addGoalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: IOS_COLORS.systemOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addGoalButtonDisabled: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  suggestionsSection: {
    marginTop: IOS_SPACING.sm,
  },
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: STEP_COLORS.accentLight,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: STEP_COLORS.accentLight,
  },
  suggestionChipText: {
    fontSize: 12,
    color: STEP_COLORS.accent,
    fontWeight: '500',
    maxWidth: 160,
  },
  goalHint: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    fontStyle: 'italic',
    marginTop: 4,
  },
  collaboratorChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: IOS_SPACING.xs,
    marginBottom: IOS_SPACING.sm,
  },
  collaboratorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  collaboratorChipPlatform: {
    backgroundColor: STEP_COLORS.accentLight,
  },
  collaboratorChipExternal: {
    backgroundColor: IOS_COLORS.systemGray6,
  },
  sendLinkButton: {
    marginLeft: 2,
    padding: 2,
  },
  collaboratorChipEmoji: {
    fontSize: 14,
  },
  collaboratorChipText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  collaboratorChipTextPlatform: {
    color: STEP_COLORS.accent,
  },
  collaboratorChipTextExternal: {
    color: IOS_COLORS.label,
  },
  addPeopleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.xs,
    paddingVertical: IOS_SPACING.xs,
  },
  addPeopleText: {
    fontSize: 14,
    fontWeight: '500',
    color: STEP_COLORS.accent,
  },
  connectionSpaceInput: {
    fontSize: 14,
    color: IOS_COLORS.label,
    backgroundColor: IOS_COLORS.systemGray6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: IOS_COLORS.systemGray4,
    paddingHorizontal: IOS_SPACING.sm,
    paddingVertical: 8,
    marginTop: IOS_SPACING.sm,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  conditionsContainer: {
    marginTop: IOS_SPACING.sm,
    marginBottom: IOS_SPACING.sm,
  },
  readOnlyInput: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: IOS_COLORS.secondaryLabel,
  },
});
