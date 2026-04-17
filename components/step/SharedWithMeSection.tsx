/**
 * SharedWithMeSection
 *
 * Compact horizontal scrollable section showing steps where the current user
 * is a collaborator (added by someone else). Displayed below the main timeline.
 *
 * Each card has Skip / Add actions. Tapping the card body opens a preview modal
 * with Dismiss, Add to Timeline, and Close (leave in bar) options.
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useCollaboratedSteps, useMyTimeline } from '@/hooks/useTimelineSteps';
import { useAuth } from '@/providers/AuthProvider';
import type { TimelineStepRecord } from '@/types/timeline-steps';
import type { StepMetadata, StepPlanData } from '@/types/step-detail';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const C = {
  bg: 'transparent',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E4E1',
  accent: '#3D8A5A',
  accentBg: 'rgba(61,138,90,0.08)',
  gold: '#D4A64A',
  coral: '#D89575',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#9C9B99',
  badgeBg: '#EDECEA',
  overlay: 'rgba(0,0,0,0.4)',
  dangerLight: 'rgba(220,80,60,0.08)',
  danger: '#DC503C',
} as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Planned', color: C.labelMid, icon: 'ellipse-outline' },
  in_progress: { label: 'Active', color: C.gold, icon: 'play-circle-outline' },
  completed: { label: 'Done', color: C.accent, icon: 'checkmark-circle' },
  skipped: { label: 'Skipped', color: C.coral, icon: 'close-circle-outline' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SharedWithMeSectionProps {
  interestId?: string | null;
  onSelectStep: (stepId: string) => void;
}

export function SharedWithMeSection({ interestId, onSelectStep }: SharedWithMeSectionProps) {
  const { data: steps } = useCollaboratedSteps(interestId);
  const { data: mySteps } = useMyTimeline(interestId);
  const { user } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [previewStep, setPreviewStep] = useState<TimelineStepRecord | null>(null);

  // Persist dismissed IDs via AsyncStorage
  const dismissKey = user?.id ? `step-dismissed-${user.id}` : null;

  useEffect(() => {
    if (!dismissKey) return;
    AsyncStorage.getItem(dismissKey).then((raw) => {
      if (raw) {
        try { setDismissedIds(new Set(JSON.parse(raw))); } catch {}
      }
    });
  }, [dismissKey]);

  // Hide steps that are already on the user's timeline (getUserTimeline now includes collaborated steps)
  const myStepIds = new Set((mySteps ?? []).map((s) => s.id));

  const visibleSteps = steps?.filter(
    (s) => !dismissedIds.has(s.id) && !myStepIds.has(s.id),
  );

  const handleOpen = useCallback(
    (step: TimelineStepRecord) => {
      setPreviewStep(null);
      onSelectStep(step.id);
    },
    [onSelectStep],
  );

  const handleDismiss = useCallback((stepId: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev).add(stepId);
      if (dismissKey) {
        AsyncStorage.setItem(dismissKey, JSON.stringify([...next])).catch(() => {});
      }
      return next;
    });
    setPreviewStep(null);
  }, [dismissKey]);

  if (!visibleSteps || visibleSteps.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="people-outline" size={13} color={C.labelMid} />
        <Text style={styles.headerTitle}>Shared with me</Text>
        <Text style={styles.headerCount}>{visibleSteps.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleSteps.map((step) => (
          <SharedStepCard
            key={step.id}
            step={step}
            onPress={() => onSelectStep(step.id)}
            onOpen={() => handleOpen(step)}
            onDismiss={() => handleDismiss(step.id)}
          />
        ))}
      </ScrollView>

      {/* Preview modal */}
      {previewStep && (
        <StepPreviewModal
          step={previewStep}
          onClose={() => setPreviewStep(null)}
          onOpen={() => handleOpen(previewStep)}
          onDismiss={() => handleDismiss(previewStep.id)}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Card — compact inline pill with action buttons
// ---------------------------------------------------------------------------

function SharedStepCard({
  step,
  onPress,
  onOpen,
  onDismiss,
}: {
  step: TimelineStepRecord;
  onPress: () => void;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const metadata = (step.metadata ?? {}) as StepMetadata;
  const plan: StepPlanData = metadata.plan ?? {};
  const statusCfg = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.pending;
  const collaborators = plan.collaborators ?? [];
  const ownerCollab = collaborators.find(
    (c) => c.type === 'platform' && c.user_id === step.user_id,
  );
  const ownerName = ownerCollab?.display_name;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.card}>
      <Pressable style={styles.cardContent} onPress={onPress}>
        {/* Status dot + title row */}
        <View style={styles.titleRow}>
          <Ionicons name={statusCfg.icon as any} size={10} color={statusCfg.color} />
          <Text style={styles.cardTitle} numberOfLines={1}>
            {step.title}
          </Text>
        </View>

        {/* Footer: owner + date */}
        <View style={styles.cardFooter}>
          {ownerName && (
            <Text style={styles.ownerText} numberOfLines={1}>from {ownerName}</Text>
          )}
          {step.starts_at && (
            <Text style={styles.footerDate}>{formatDate(step.starts_at)}</Text>
          )}
        </View>
      </Pressable>

      {/* Action row */}
      <View style={styles.actionRow}>
        <Pressable style={styles.adoptBtn} onPress={onOpen}>
          <Ionicons name="open-outline" size={12} color={C.accent} />
          <Text style={styles.adoptText}>Open</Text>
        </Pressable>
        <Pressable style={styles.dismissBtn} onPress={onDismiss}>
          <Ionicons name="close" size={12} color={C.labelLight} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Preview modal — shows step details with actions
// ---------------------------------------------------------------------------

function StepPreviewModal({
  step,
  onClose,
  onOpen,
  onDismiss,
}: {
  step: TimelineStepRecord;
  onClose: () => void;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const metadata = (step.metadata ?? {}) as StepMetadata;
  const plan: StepPlanData = metadata.plan ?? {};
  const statusCfg = STATUS_CONFIG[step.status] ?? STATUS_CONFIG.pending;
  const collaborators = plan.collaborators ?? [];
  const ownerCollab = collaborators.find(
    (c) => c.type === 'platform' && c.user_id === step.user_id,
  );
  const ownerName = ownerCollab?.display_name;
  const subSteps = plan.how_sub_steps?.filter((s) => s.text.trim()) ?? [];
  const capabilities = plan.capability_goals ?? [];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          {/* Close X */}
          <Pressable style={styles.modalCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={C.labelMid} />
          </Pressable>

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalStatusRow}>
              <Ionicons name={statusCfg.icon as any} size={14} color={statusCfg.color} />
              <Text style={styles.modalStatusLabel}>{statusCfg.label}</Text>
            </View>
            <Text style={styles.modalTitle}>{step.title}</Text>
            {ownerName && (
              <Text style={styles.modalOwner}>from {ownerName}</Text>
            )}
          </View>

          {/* Plan content */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {plan.what_will_you_do && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>PLAN</Text>
                <Text style={styles.modalSectionText}>{plan.what_will_you_do}</Text>
              </View>
            )}

            {subSteps.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>SUB-STEPS</Text>
                {subSteps.map((sub) => (
                  <View key={sub.id} style={styles.subStepRow}>
                    <Ionicons
                      name={sub.completed ? 'checkmark-circle' : 'ellipse-outline'}
                      size={13}
                      color={sub.completed ? C.accent : C.labelLight}
                    />
                    <Text style={[
                      styles.subStepText,
                      sub.completed && styles.subStepCompleted,
                    ]}>
                      {sub.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {capabilities.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>SKILLS</Text>
                <View style={styles.capRow}>
                  {capabilities.map((cap, i) => (
                    <View key={i} style={styles.capPill}>
                      <Text style={styles.capText}>{cap}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {plan.linked_resource_ids && plan.linked_resource_ids.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>
                  RESOURCES · {plan.linked_resource_ids.length}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.modalActions}>
            <Pressable style={styles.modalDismissBtn} onPress={onDismiss}>
              <Ionicons name="close-circle-outline" size={16} color={C.coral} />
              <Text style={styles.modalDismissText}>Skip</Text>
            </Pressable>
            <Pressable style={styles.modalAdoptBtn} onPress={onOpen}>
              <Ionicons name="open-outline" size={16} color="#fff" />
              <Text style={styles.modalAdoptText}>Open Step</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: C.labelMid,
  },
  headerCount: {
    fontSize: 10,
    fontWeight: '600',
    color: C.labelLight,
    backgroundColor: C.badgeBg,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },

  // Card — compact with action row
  card: {
    width: 160,
    backgroundColor: C.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.03)' } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
    }),
  },
  cardContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: C.labelDark,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ownerText: {
    fontSize: 10,
    color: C.accent,
    fontWeight: '500',
    maxWidth: 80,
  },
  footerDate: {
    fontSize: 10,
    color: C.labelLight,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.cardBorder,
  },
  adoptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 5,
  },
  adoptText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.accent,
  },
  dismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: C.cardBorder,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: C.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.18)' } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 32,
      },
    }),
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 4,
  },
  modalStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modalStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.labelMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.labelDark,
    paddingRight: 28,
  },
  modalOwner: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '500',
  },
  modalBody: {
    paddingHorizontal: 20,
    maxHeight: 300,
  },
  modalSection: {
    paddingBottom: 14,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.labelLight,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalSectionText: {
    fontSize: 14,
    color: C.labelDark,
    lineHeight: 20,
  },
  subStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 3,
  },
  subStepText: {
    fontSize: 13,
    color: C.labelDark,
    flex: 1,
    lineHeight: 18,
  },
  subStepCompleted: {
    color: C.labelLight,
    textDecorationLine: 'line-through',
  },
  capRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  capPill: {
    backgroundColor: C.accentBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  capText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.accent,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.cardBorder,
  },
  modalDismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  modalDismissText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.coral,
  },
  modalAdoptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.accent,
  },
  modalAdoptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
