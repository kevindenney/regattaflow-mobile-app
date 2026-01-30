/**
 * TrainingPlansSection - Structured race prep programs
 *
 * Shows training plans with activities, progress tracking,
 * and completion status, similar to training apps.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import type { TrainingPlan, TrainingActivity } from '@/hooks/useReflectProfile';

interface TrainingPlansSectionProps {
  plans: TrainingPlan[];
  onStartPlan?: (planId: string) => void;
  onCompleteActivity?: (planId: string, activityId: string) => void;
  onViewPlanDetails?: (planId: string) => void;
  onCreatePlan?: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActivityIcon(type: TrainingActivity['type']): string {
  const icons: Record<TrainingActivity['type'], string> = {
    video: 'play-circle',
    article: 'document-text',
    drill: 'timer',
    workout: 'fitness',
    race_review: 'analytics',
    mental: 'eye',
  };
  return icons[type] || 'checkmark-circle';
}

function getStatusColor(status: TrainingPlan['status']): string {
  switch (status) {
    case 'completed':
      return IOS_COLORS.systemGreen;
    case 'in_progress':
      return IOS_COLORS.systemBlue;
    case 'not_started':
      return IOS_COLORS.systemGray3;
  }
}

function getStatusLabel(status: TrainingPlan['status']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'not_started':
      return 'Not Started';
  }
}

function PlanCard({
  plan,
  onPress,
  onCompleteActivity,
}: {
  plan: TrainingPlan;
  onPress: () => void;
  onCompleteActivity?: (planId: string, activityId: string) => void;
}) {
  const progress = plan.totalActivities > 0
    ? (plan.completedActivities / plan.totalActivities) * 100
    : 0;

  const nextActivity = plan.activities.find((a) => !a.isCompleted);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.planCard,
        pressed && styles.planCardPressed,
      ]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.planHeader}>
        <View style={styles.planTitleRow}>
          <Text style={styles.planTitle} numberOfLines={1}>
            {plan.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(plan.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(plan.status) },
              ]}
            >
              {getStatusLabel(plan.status)}
            </Text>
          </View>
        </View>
        {plan.targetRace && (
          <View style={styles.targetRow}>
            <Ionicons
              name="flag"
              size={12}
              color={IOS_COLORS.secondaryLabel}
            />
            <Text style={styles.targetText}>
              {plan.targetRace}
              {plan.targetDate && ` • ${formatDate(plan.targetDate)}`}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: getStatusColor(plan.status),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {plan.completedActivities}/{plan.totalActivities} activities
        </Text>
      </View>

      {/* Next Activity */}
      {nextActivity && plan.status === 'in_progress' && (
        <View style={styles.nextActivity}>
          <Text style={styles.nextLabel}>Next:</Text>
          <View style={styles.activityPreview}>
            <View style={styles.activityIconSmall}>
              <Ionicons
                name={getActivityIcon(nextActivity.type) as any}
                size={14}
                color={IOS_COLORS.systemBlue}
              />
            </View>
            <Text style={styles.activityTitleSmall} numberOfLines={1}>
              {nextActivity.title}
            </Text>
            {nextActivity.duration && (
              <Text style={styles.activityDuration}>
                {formatDuration(nextActivity.duration)}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.planFooter}>
        <Text style={styles.durationText}>
          {formatDuration(plan.estimatedDuration)} total
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={IOS_COLORS.tertiaryLabel}
        />
      </View>
    </Pressable>
  );
}

function PlanDetailModal({
  plan,
  visible,
  onClose,
  onCompleteActivity,
}: {
  plan: TrainingPlan | null;
  visible: boolean;
  onClose: () => void;
  onCompleteActivity?: (planId: string, activityId: string) => void;
}) {
  if (!plan) return null;

  const handleActivityPress = (activity: TrainingActivity) => {
    if (!activity.isCompleted && onCompleteActivity) {
      onCompleteActivity(plan.id, activity.id);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalTitleContainer}>
            <Text style={styles.modalTitle}>{plan.title}</Text>
            {plan.description && (
              <Text style={styles.modalDescription}>{plan.description}</Text>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={IOS_COLORS.label} />
          </Pressable>
        </View>

        {/* Target Info */}
        {plan.targetRace && (
          <View style={styles.targetInfo}>
            <Ionicons name="flag" size={16} color={IOS_COLORS.systemOrange} />
            <Text style={styles.targetInfoText}>
              Target: {plan.targetRace}
              {plan.targetDate && ` (${formatDate(plan.targetDate)})`}
            </Text>
          </View>
        )}

        {/* Progress Summary */}
        <View style={styles.progressSummary}>
          <View style={styles.progressStatBox}>
            <Text style={styles.progressStatValue}>
              {plan.completedActivities}
            </Text>
            <Text style={styles.progressStatLabel}>Completed</Text>
          </View>
          <View style={styles.progressStatBox}>
            <Text style={styles.progressStatValue}>
              {plan.totalActivities - plan.completedActivities}
            </Text>
            <Text style={styles.progressStatLabel}>Remaining</Text>
          </View>
          <View style={styles.progressStatBox}>
            <Text style={styles.progressStatValue}>
              {formatDuration(plan.estimatedDuration)}
            </Text>
            <Text style={styles.progressStatLabel}>Est. Time</Text>
          </View>
        </View>

        {/* Activities List */}
        <ScrollView style={styles.activitiesList}>
          <Text style={styles.activitiesHeader}>Activities</Text>
          {plan.activities.map((activity, index) => (
            <Pressable
              key={activity.id}
              style={({ pressed }) => [
                styles.activityRow,
                activity.isCompleted && styles.activityRowCompleted,
                pressed && !activity.isCompleted && styles.activityRowPressed,
              ]}
              onPress={() => handleActivityPress(activity)}
              disabled={activity.isCompleted}
            >
              <View style={styles.activityNumber}>
                {activity.isCompleted ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={IOS_COLORS.systemGreen}
                  />
                ) : (
                  <Text style={styles.activityNumberText}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <View style={styles.activityTypeIcon}>
                    <Ionicons
                      name={getActivityIcon(activity.type) as any}
                      size={16}
                      color={
                        activity.isCompleted
                          ? IOS_COLORS.systemGray3
                          : IOS_COLORS.systemBlue
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.activityTitle,
                      activity.isCompleted && styles.activityTitleCompleted,
                    ]}
                  >
                    {activity.title}
                  </Text>
                </View>
                {activity.description && (
                  <Text
                    style={[
                      styles.activityDescription,
                      activity.isCompleted && styles.activityDescriptionCompleted,
                    ]}
                    numberOfLines={2}
                  >
                    {activity.description}
                  </Text>
                )}
                <View style={styles.activityMeta}>
                  {activity.duration && (
                    <Text style={styles.activityMetaText}>
                      {formatDuration(activity.duration)}
                    </Text>
                  )}
                  {activity.completedAt && (
                    <Text style={styles.activityMetaText}>
                      Completed {formatDate(activity.completedAt)}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function TrainingPlansSection({
  plans,
  onStartPlan,
  onCompleteActivity,
  onViewPlanDetails,
  onCreatePlan,
}: TrainingPlansSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);

  const inProgressPlans = plans.filter((p) => p.status === 'in_progress');
  const otherPlans = plans.filter((p) => p.status !== 'in_progress');

  const handlePlanPress = (plan: TrainingPlan) => {
    setSelectedPlan(plan);
    onViewPlanDetails?.(plan.id);
  };

  if (plans.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Training Plans</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons
            name="clipboard-outline"
            size={40}
            color={IOS_COLORS.systemGray3}
          />
          <Text style={styles.emptyText}>No Training Plans</Text>
          <Text style={styles.emptySubtext}>
            Create a training plan to prepare for your next race
          </Text>
          {onCreatePlan && (
            <Pressable
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.createButtonPressed,
              ]}
              onPress={onCreatePlan}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Plan</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Training Plans</Text>
        {onCreatePlan && (
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            onPress={onCreatePlan}
          >
            <Ionicons name="add" size={20} color={IOS_COLORS.systemBlue} />
          </Pressable>
        )}
      </View>

      {/* In Progress Plans */}
      {inProgressPlans.length > 0 && (
        <View style={styles.planGroup}>
          <Text style={styles.groupLabel}>Active</Text>
          {inProgressPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPress={() => handlePlanPress(plan)}
              onCompleteActivity={onCompleteActivity}
            />
          ))}
        </View>
      )}

      {/* Other Plans */}
      {otherPlans.length > 0 && (
        <View style={styles.planGroup}>
          {inProgressPlans.length > 0 && (
            <Text style={styles.groupLabel}>Other Plans</Text>
          )}
          {otherPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onPress={() => handlePlanPress(plan)}
              onCompleteActivity={onCompleteActivity}
            />
          ))}
        </View>
      )}

      {/* Detail Modal */}
      <PlanDetailModal
        plan={selectedPlan}
        visible={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onCompleteActivity={onCompleteActivity}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.41,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: {
    opacity: 0.7,
  },
  planGroup: {
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  planCard: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    ...IOS_SHADOWS.sm,
  },
  planCardPressed: {
    opacity: 0.7,
  },
  planHeader: {
    marginBottom: 10,
  },
  planTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  planTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  targetText: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: IOS_COLORS.systemGray5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
  },
  nextActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  activityPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityIconSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitleSmall: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  activityDuration: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
  },
  emptyState: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: IOS_COLORS.systemBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  createButtonPressed: {
    opacity: 0.8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingTop: 20,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  modalDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: IOS_COLORS.systemOrange + '15',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
  },
  targetInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.systemOrange,
  },
  progressSummary: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
  },
  progressStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  progressStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  activitiesList: {
    flex: 1,
    marginTop: 16,
  },
  activitiesHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    gap: 12,
  },
  activityRowCompleted: {
    opacity: 0.7,
  },
  activityRowPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  activityNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.systemGray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.systemBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  activityTitleCompleted: {
    textDecorationLine: 'line-through',
    color: IOS_COLORS.secondaryLabel,
  },
  activityDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: IOS_COLORS.secondaryLabel,
    marginTop: 4,
  },
  activityDescriptionCompleted: {
    color: IOS_COLORS.tertiaryLabel,
  },
  activityMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  activityMetaText: {
    fontSize: 12,
    fontWeight: '400',
    color: IOS_COLORS.tertiaryLabel,
  },
});

export default TrainingPlansSection;
