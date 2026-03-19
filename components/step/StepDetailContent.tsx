/**
 * StepDetailContent — Header + Plan/Act/Review tabs for a single step.
 */

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SPACING } from '@/lib/design-tokens-ios';
import { STEP_COLORS } from '@/lib/step-theme';
import { IOSPillTabs, usePillTabs } from '@/components/ui/ios/IOSPillTabs';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useStepDetail, useUpdateStepMetadata } from '@/hooks/useStepDetail';
import { useUpdateStep } from '@/hooks/useTimelineSteps';
import { PlanTab } from './PlanTab';
import { ActTab } from './ActTab';
import { ReviewTab } from './ReviewTab';
import type { StepPlanData, StepActData, StepReviewData, StepMetadata } from '@/types/step-detail';
import type { TimelineStepStatus } from '@/types/timeline-steps';

type TabValue = 'plan' | 'act' | 'review';

function getDefaultTab(status?: TimelineStepStatus): TabValue {
  switch (status) {
    case 'in_progress': return 'act';
    case 'completed': return 'review';
    default: return 'plan';
  }
}

interface StepDetailContentProps {
  stepId: string;
}

export function StepDetailContent({ stepId }: StepDetailContentProps) {
  const { vocab } = useVocabulary();
  const { data: step, isLoading, error } = useStepDetail(stepId);
  const updateMetadata = useUpdateStepMetadata(stepId);
  const updateStep = useUpdateStep();

  // Debounce timer ref for auto-save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const pendingTitleRef = useRef<string | null>(null);

  const handleTitleChange = useCallback((text: string) => {
    setEditingTitle(text);
    pendingTitleRef.current = text;
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      pendingTitleRef.current = null;
      updateStep.mutate({ stepId, input: { title: text } });
    }, 800);
  }, [stepId, updateStep]);

  // Flush any pending title save on unmount
  useEffect(() => {
    return () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (pendingTitleRef.current !== null) {
        updateStep.mutate({ stepId, input: { title: pendingTitleRef.current } });
      }
    };
  }, [stepId, updateStep]);

  // Default tab based on step status
  const defaultTab = useMemo(() => getDefaultTab(step?.status), [step?.status]);
  const [activeTab, setActiveTab] = usePillTabs<TabValue>(defaultTab);

  const metadata = (step?.metadata ?? {}) as StepMetadata;
  const serverPlanData: StepPlanData = metadata.plan ?? {};
  const actData = metadata.act ?? {};
  const reviewData = metadata.review ?? {};

  // Optimistic local plan state so TextInputs are responsive while saving
  const [localPlanOverrides, setLocalPlanOverrides] = useState<Partial<StepPlanData>>({});
  const planData: StepPlanData = useMemo(
    () => ({ ...serverPlanData, ...localPlanOverrides }),
    [serverPlanData, localPlanOverrides],
  );

  // Sync: clear local overrides when server data catches up
  useEffect(() => {
    setLocalPlanOverrides({});
  }, [serverPlanData]);

  // Determine tab completion states
  const isPlanComplete = Boolean(
    planData.what_will_you_do?.trim() ||
    (planData.how_sub_steps?.length && planData.how_sub_steps.some((s) => s.text.trim()))
  );
  const isActComplete = Boolean(
    actData.notes?.trim() ||
    actData.media_uploads?.length ||
    actData.media_links?.length ||
    (actData.sub_step_progress && Object.values(actData.sub_step_progress).some(Boolean))
  );
  const isReviewComplete = Boolean(
    reviewData.what_learned?.trim() ||
    (reviewData.capability_progress && Object.keys(reviewData.capability_progress).length > 0)
  );

  const tabs = useMemo(() => [
    { value: 'plan' as const, label: vocab('Plan Phase'), completed: isPlanComplete },
    { value: 'act' as const, label: vocab('Do Phase'), completed: isActComplete },
    { value: 'review' as const, label: vocab('Review Phase'), completed: isReviewComplete },
  ], [vocab, isPlanComplete, isActComplete, isReviewComplete]);

  // Auto-save status tracking
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const prevSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-save for plan data — update local state immediately, persist after debounce
  const pendingPlanRef = useRef<Partial<StepPlanData> | null>(null);
  const handlePlanUpdate = useCallback((partial: Partial<StepPlanData>) => {
    setLocalPlanOverrides((prev) => {
      const merged = { ...prev, ...partial };
      pendingPlanRef.current = merged;
      return merged;
    });
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      pendingPlanRef.current = null;
      updateMetadata.mutate(
        { plan: { ...serverPlanData, ...localPlanOverrides, ...partial } },
        { onSuccess: () => setLastSaved(new Date()) },
      );
    }, 800);
  }, [serverPlanData, localPlanOverrides, updateMetadata]);

  // Flush any pending plan save on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (pendingPlanRef.current !== null) {
        updateMetadata.mutate({ plan: { ...serverPlanData, ...pendingPlanRef.current } });
      }
    };
  }, [serverPlanData, updateMetadata]);

  // Navigate to next tab
  const handleNextTab = useCallback((next: TabValue) => {
    setActiveTab(next);
  }, [setActiveTab]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={STEP_COLORS.accent} />
      </View>
    );
  }

  if (error || !step) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={STEP_COLORS.coral} />
        <Text style={styles.errorText}>Step not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.sessionRow}>
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>SESSION</Text>
          </View>
          {lastSaved && (
            <View style={styles.autoSaveIndicator}>
              <Ionicons name="cloud-done-outline" size={12} color={STEP_COLORS.tertiaryLabel} />
              <Text style={styles.autoSaveText}>Saved</Text>
            </View>
          )}
          <Pressable
            style={styles.menuButton}
            onPress={() => router.push('/library')}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={STEP_COLORS.secondaryLabel} />
          </Pressable>
        </View>
        <TextInput
          style={styles.titleInput}
          value={editingTitle ?? step.title}
          onChangeText={handleTitleChange}
          placeholder={`${vocab('Learning Event')} title...`}
          placeholderTextColor={STEP_COLORS.tertiaryLabel}
          selectTextOnFocus
        />
        {step.description && (
          <Text style={styles.description} numberOfLines={2}>{step.description}</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <IOSPillTabs
          tabs={tabs}
          selectedValue={activeTab}
          onChange={setActiveTab}
          compact
          accentColor={STEP_COLORS.accent}
          unselectedBgColor="transparent"
          unselectedBorderColor={STEP_COLORS.tabBorder}
        />
      </View>

      {/* Tab content */}
      <View style={styles.tabContent}>
        {activeTab === 'plan' && (
          <PlanTab
            stepId={stepId}
            planData={planData}
            interestId={step.interest_id}
            onUpdate={handlePlanUpdate}
            onNextTab={() => handleNextTab('act')}
          />
        )}
        {activeTab === 'act' && (
          <ActTab stepId={stepId} onNextTab={() => handleNextTab('review')} />
        )}
        {activeTab === 'review' && <ReviewTab stepId={stepId} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STEP_COLORS.pageBg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: IOS_SPACING.sm,
  },
  errorText: {
    fontSize: 16,
    color: STEP_COLORS.secondaryLabel,
    fontWeight: '500',
  },
  header: {
    backgroundColor: STEP_COLORS.headerBg,
    paddingHorizontal: IOS_SPACING.md,
    paddingTop: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STEP_COLORS.border,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IOS_SPACING.xs,
  },
  sessionBadge: {
    backgroundColor: STEP_COLORS.badgeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: STEP_COLORS.badgeText,
    letterSpacing: 1,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: STEP_COLORS.label,
    padding: 0,
    margin: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  description: {
    fontSize: 14,
    color: STEP_COLORS.secondaryLabel,
    marginTop: 4,
    lineHeight: 20,
  },
  tabsWrapper: {
    backgroundColor: STEP_COLORS.headerBg,
    paddingHorizontal: IOS_SPACING.md,
    paddingTop: IOS_SPACING.xs,
    paddingBottom: IOS_SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: STEP_COLORS.border,
  },
  tabContent: {
    flex: 1,
  },
  autoSaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    marginRight: IOS_SPACING.sm,
  },
  autoSaveText: {
    fontSize: 11,
    color: STEP_COLORS.tertiaryLabel,
    fontWeight: '400',
  },
});
