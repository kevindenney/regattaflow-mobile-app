/**
 * SuggestedStepsBar — Horizontal bar of mentor-suggested steps.
 *
 * Queries `step_suggested` notifications and renders each as a card
 * with Adopt / Dismiss actions. Sits below the subscriber's timeline grid.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationService, type SocialNotification } from '@/services/NotificationService';
import { adoptStep } from '@/services/TimelineStepService';
import { triggerHaptic } from '@/lib/haptics';

// =============================================================================
// COLORS
// =============================================================================

const C = {
  bg: '#FFFFFF',
  card: '#F8F7F6',
  border: '#E5E4E1',
  accent: '#00897B',
  accentBg: 'rgba(0,137,123,0.08)',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#9C9B99',
  green: '#16A34A',
  greenBg: '#DCFCE7',
} as const;

// =============================================================================
// PROPS
// =============================================================================

interface SuggestedStepsBarProps {
  interestId?: string | null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SuggestedStepsBar({ interestId }: SuggestedStepsBarProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adoptingId, setAdoptingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [adoptedIds, setAdoptedIds] = useState<Set<string>>(new Set());

  // Fetch step_suggested notifications
  const { data: suggestions } = useQuery({
    queryKey: ['step-suggestions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { notifications } = await NotificationService.getNotifications(user.id, {
        limit: 20,
        types: ['step_suggested'],
      });
      return notifications;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // Only show unread suggestions that haven't been dismissed or adopted
  const visibleSuggestions = useMemo(() => {
    if (!suggestions) return [];
    return suggestions.filter(
      (n) =>
        !n.isRead &&
        !dismissedIds.has(n.id) &&
        !adoptedIds.has(n.id) &&
        n.data?.step_title,
    );
  }, [suggestions, dismissedIds, adoptedIds]);

  const handleAdopt = useCallback(
    async (notification: SocialNotification) => {
      if (!user?.id) return;
      const stepTitle = notification.data?.step_title;
      const sourceStepId = notification.data?.source_step_id;
      const notifInterestId = notification.data?.interest_id || interestId;
      if (!stepTitle) return;

      setAdoptingId(notification.id);
      try {
        triggerHaptic('selection');

        if (sourceStepId && sourceStepId !== 'custom') {
          // Adopt from an existing step
          await adoptStep(user.id, sourceStepId, notifInterestId || '');
        } else {
          // Custom suggestion — create a new step with just the title
          const { createStep } = await import('@/services/TimelineStepService');
          await createStep({
            user_id: user.id,
            title: stepTitle,
            description: notification.data?.step_description || undefined,
            interest_id: notifInterestId || '',
          });
        }

        setAdoptedIds((prev) => new Set(prev).add(notification.id));

        // Mark notification as read
        await NotificationService.markAsRead(user.id, notification.id);

        // Invalidate timeline queries
        queryClient.invalidateQueries({ queryKey: ['timeline-steps', 'mine'] });
        queryClient.invalidateQueries({ queryKey: ['step-suggestions'] });
      } catch (err) {
        console.warn('[SuggestedStepsBar] Failed to adopt step:', err);
      } finally {
        setAdoptingId(null);
      }
    },
    [user?.id, interestId, queryClient],
  );

  const handleDismiss = useCallback(
    async (notification: SocialNotification) => {
      if (!user?.id) return;
      triggerHaptic('selection');
      setDismissedIds((prev) => new Set(prev).add(notification.id));

      // Mark as read
      await NotificationService.markAsRead(user.id, notification.id);
    },
    [user?.id],
  );

  if (!visibleSuggestions.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={16} color={C.accent} />
        <Text style={styles.headerText}>Suggested for You</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleSuggestions.map((notification) => {
          const isAdopting = adoptingId === notification.id;
          const isAdopted = adoptedIds.has(notification.id);
          const suggestedBy = notification.actorName || 'Your mentor';

          return (
            <View key={notification.id} style={styles.card}>
              {/* Title + description */}
              <Text style={styles.cardTitle} numberOfLines={2}>
                {notification.data?.step_title}
              </Text>
              {notification.data?.step_description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {notification.data.step_description}
                </Text>
              ) : null}
              <Text style={styles.cardFrom} numberOfLines={1}>
                From {suggestedBy}
              </Text>

              {/* Actions */}
              <View style={styles.cardActions}>
                {isAdopted ? (
                  <View style={styles.adoptedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={C.green} />
                    <Text style={styles.adoptedText}>Added</Text>
                  </View>
                ) : (
                  <>
                    <Pressable
                      style={({ pressed }) => [
                        styles.adoptButton,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleAdopt(notification)}
                      disabled={isAdopting}
                    >
                      {isAdopting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.adoptButtonText}>Adopt</Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.dismissButton,
                        pressed && { opacity: 0.7 },
                      ]}
                      onPress={() => handleDismiss(notification)}
                    >
                      <Ionicons name="close" size={16} color={C.labelLight} />
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.labelDark,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: 200,
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.labelDark,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: C.labelMid,
    lineHeight: 16,
    marginBottom: 4,
  },
  cardFrom: {
    fontSize: 11,
    color: C.labelLight,
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adoptButton: {
    flex: 1,
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  adoptButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  adoptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
  },
  adoptedText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.green,
  },
});
