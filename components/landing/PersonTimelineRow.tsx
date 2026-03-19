import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { SamplePerson, SampleTimelineStep } from '@/lib/landing/sampleData';
import { personSlug } from '@/lib/landing/sampleData';
import { useAuth } from '@/providers/AuthProvider';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { CrewFinderService as crewFinderService } from '@/services/CrewFinderService';
import { useAdoptStep, useCreateStep } from '@/hooks/useTimelineSteps';
import { resolveInterestId } from '@/services/TimelineStepService';
import { useInterest, type Interest } from '@/providers/InterestProvider';

interface PersonTimelineRowProps {
  person: SamplePerson;
  accentColor: string;
  compact?: boolean;
  /** Real DB step IDs parallel to person.timeline, enables adopt */
  realStepIds?: string[];
  /** Interest UUID for adopt operations */
  interestId?: string;
  /** Interest slug — resolved to ID when creating steps from sample data */
  interestSlug?: string;
}

// ── Inline step detail (expands below the row) ────────────────────
function InlineStepDetail({
  step,
  accentColor,
  onClose,
  isLoggedIn,
  userId,
  realStepId,
  interestId,
  interestSlug,
  stepIndex = 0,
}: {
  step: SampleTimelineStep;
  accentColor: string;
  onClose: () => void;
  isLoggedIn: boolean;
  userId?: string;
  realStepId?: string;
  interestId?: string;
  interestSlug?: string;
  stepIndex?: number;
}) {
  const [added, setAdded] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const adoptMutation = useAdoptStep();
  const createMutation = useCreateStep();
  const { user } = useAuth();
  const { userInterests, switchInterest } = useInterest();
  const isCompleted = step.status === 'completed';
  const isCurrent = step.status === 'current';
  const isBusy = adoptMutation.isPending || createMutation.isPending;

  /** Actually create/adopt the step for a given interest, then navigate */
  const addStepToInterest = async (targetInterest: Interest) => {
    try {
      if (realStepId && interestId) {
        await adoptMutation.mutateAsync({ sourceStepId: realStepId, interestId: targetInterest.id });
      } else {
        const resolvedInterestId = targetInterest.id;
        const startsAt = new Date();
        startsAt.setDate(startsAt.getDate() + Math.max(stepIndex, 0));
        await createMutation.mutateAsync({
          user_id: user!.id,
          interest_id: resolvedInterestId,
          title: step.label,
          description: step.detail ?? null,
          source_type: 'copied',
          category: 'general',
          status: 'pending',
          starts_at: startsAt.toISOString(),
        });
      }
      setAdded(true);
      // Switch to the target interest and navigate to races tab (where timeline steps appear)
      await switchInterest(targetInterest.slug);
      router.push('/(tabs)/races');
    } catch (err) {
      showAlert('Error', 'Could not add this step. Please try again.');
    }
  };

  const handleAddToGoals = async () => {
    if (!isLoggedIn || !user) {
      router.push('/(auth)/signup');
      return;
    }

    // If user has multiple interests, show picker
    if (userInterests.length > 1) {
      setPickerVisible(true);
      return;
    }

    // Single interest (or none) — add directly
    if (userInterests.length === 1) {
      await addStepToInterest(userInterests[0]);
      return;
    }

    // Fallback: no user interests, use the source interest
    try {
      const resolvedId = interestId || (interestSlug ? await resolveInterestId(interestSlug) : null);
      if (!resolvedId) {
        showAlert('Error', 'Could not determine the interest for this step.');
        return;
      }
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + Math.max(stepIndex, 0));
      await createMutation.mutateAsync({
        user_id: user.id,
        interest_id: resolvedId,
        title: step.label,
        description: step.detail ?? null,
        source_type: 'copied',
        category: 'general',
        status: 'pending',
        starts_at: startsAt.toISOString(),
      });
      setAdded(true);
      router.push('/(tabs)/races');
    } catch (err) {
      showAlert('Error', 'Could not add this step. Please try again.');
    }
  };

  return (
    <View style={detailStyles.container}>
      <View style={[detailStyles.card, { borderLeftColor: accentColor }]}>
        <View style={detailStyles.header}>
          {/* Status pill */}
          <View
            style={[
              detailStyles.statusPill,
              {
                backgroundColor: isCompleted
                  ? accentColor
                  : isCurrent
                    ? accentColor
                    : '#E5E7EB',
              },
            ]}
          >
            <Text
              style={[
                detailStyles.statusText,
                { color: step.status === 'upcoming' ? '#6B7280' : '#FFFFFF' },
              ]}
            >
              {isCompleted ? 'DONE' : isCurrent ? 'IN PROGRESS' : 'UPCOMING'}
            </Text>
          </View>

          <Text style={detailStyles.stepName}>{step.label}</Text>

          <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Detail text */}
        <Text style={detailStyles.detailText}>
          {step.detail
            ?? (isCompleted
              ? 'This step has been completed.'
              : isCurrent
                ? 'Currently working on this step.'
                : 'This step is coming up next.')}
        </Text>

        {/* Add to goals action */}
        <TouchableOpacity
          style={[
            detailStyles.addGoalBtn,
            added && { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
          ]}
          onPress={handleAddToGoals}
          disabled={added || isBusy}
        >
          <Ionicons
            name={added ? 'checkmark-circle' : 'add-circle-outline'}
            size={14}
            color={added ? '#16A34A' : accentColor}
          />
          <Text
            style={[
              detailStyles.addGoalText,
              { color: added ? '#16A34A' : accentColor },
            ]}
          >
            {added ? 'Added to Timeline' : isBusy ? 'Adding…' : isLoggedIn ? 'Add to My Timeline' : 'Sign Up to Track This'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interest picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          style={pickerStyles.overlay}
          onPress={() => setPickerVisible(false)}
        >
          <View style={pickerStyles.sheet}>
            <Text style={pickerStyles.title}>Add to which interest?</Text>
            <Text style={pickerStyles.subtitle}>
              Choose where to add "{step.label}"
            </Text>
            {userInterests.map((interest) => {
              const isSource = interest.slug === interestSlug;
              return (
                <TouchableOpacity
                  key={interest.id}
                  style={pickerStyles.option}
                  onPress={() => {
                    setPickerVisible(false);
                    void addStepToInterest(interest);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      pickerStyles.dot,
                      { backgroundColor: interest.accent_color },
                    ]}
                  />
                  <Text style={pickerStyles.optionText}>{interest.name}</Text>
                  {isSource && (
                    <Text style={pickerStyles.defaultLabel}>source</Text>
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={pickerStyles.cancelBtn}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={pickerStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  container: {
    paddingLeft: 200, // align with timeline area
    paddingRight: 12,
    paddingBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusPill: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  closeBtn: {
    padding: 2,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  addGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    alignSelf: 'flex-start',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  addGoalText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: 300,
    maxWidth: '90%',
    ...Platform.select({
      web: { boxShadow: '0 8px 32px rgba(0,0,0,0.18)' } as any,
    }),
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  defaultLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  cancelText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});

// ── Single step card ───────────────────────────────────────────────
function StepCard({
  step,
  accentColor,
  compact,
  isSelected,
  onPress,
}: {
  step: SampleTimelineStep;
  accentColor: string;
  compact?: boolean;
  isSelected: boolean;
  onPress: () => void;
}) {
  const isCompleted = step.status === 'completed';
  const isCurrent = step.status === 'current';
  const isUpcoming = step.status === 'upcoming';

  const cardWidth = compact ? 76 : 108;
  const cardHeight = compact ? 52 : 72;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.stepCard,
        {
          width: cardWidth,
          height: cardHeight,
          borderColor: isSelected
            ? accentColor
            : isCurrent
              ? accentColor
              : isCompleted
                ? accentColor + '35'
                : '#E5E7EB',
          borderWidth: isSelected || isCurrent ? 2 : 1,
          backgroundColor: isSelected
            ? accentColor + '10'
            : isCompleted
              ? accentColor + '06'
              : '#FFFFFF',
        },
      ]}
    >
      {/* Status badge */}
      {(isCompleted || isCurrent) && (
        <View
          style={[
            styles.badge,
            { backgroundColor: accentColor },
            compact && styles.badgeCompact,
          ]}
        >
          <Text style={[styles.badgeText, compact && styles.badgeTextCompact]}>
            {isCompleted ? 'DONE' : 'NOW'}
          </Text>
        </View>
      )}

      {/* Upcoming: thin gray line placeholder for badge */}
      {isUpcoming && (
        <View style={[styles.badge, styles.badgeUpcoming, compact && styles.badgeCompact]}>
          <View style={styles.badgeLine} />
        </View>
      )}

      {/* Step label */}
      <Text
        style={[
          styles.stepLabel,
          { color: isUpcoming ? '#9CA3AF' : '#374151' },
          compact && styles.stepLabelCompact,
        ]}
        numberOfLines={2}
      >
        {step.label}
      </Text>
    </TouchableOpacity>
  );
}

// ── NOW divider bar ────────────────────────────────────────────────
function NowDivider({ accentColor, compact }: { accentColor: string; compact?: boolean }) {
  return (
    <View style={[styles.nowDivider, compact && styles.nowDividerCompact]}>
      <View style={[styles.nowLine, { backgroundColor: accentColor }]} />
      <View style={[styles.nowPill, { backgroundColor: accentColor }]}>
        <Text style={[styles.nowText, compact && styles.nowTextCompact]}>NOW</Text>
      </View>
      <View style={[styles.nowLine, { backgroundColor: accentColor }]} />
    </View>
  );
}

// ── Main row ───────────────────────────────────────────────────────
export function PersonTimelineRow({ person, accentColor, compact, realStepIds, interestId, interestSlug }: PersonTimelineRowProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const selectedStep = selectedIdx !== null ? person.timeline[selectedIdx] : null;
  const { user, isGuest } = useAuth();
  const isLoggedIn = !!user && !isGuest;

  const initials = person.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const avatarSize = compact ? 30 : 36;
  const currentIdx = person.timeline.findIndex((s) => s.status === 'current');

  const handleFollow = useCallback(async () => {
    if (!isLoggedIn) {
      router.push('/(auth)/signup');
      return;
    }

    const newState = !isFollowing;
    setIsFollowing(newState);

    // Wire up real follow/unfollow when person has a userId
    if (person.userId && user) {
      try {
        if (newState) {
          await crewFinderService.followUser(user.id, person.userId);
        } else {
          await crewFinderService.unfollowUser(user.id, person.userId);
        }
      } catch {
        // Revert on error
        setIsFollowing(!newState);
        showAlert('Error', 'Could not update follow status. Please try again.');
      }
    }
  }, [isFollowing, isLoggedIn, person.userId, user]);

  return (
    <View>
      <View style={[styles.row, compact && styles.rowCompact]}>
        {/* Avatar + Name + Follow */}
        <View style={[styles.personInfo, compact && styles.personInfoCompact]}>
          <TouchableOpacity
            onPress={handleFollow}
            activeOpacity={0.7}
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                backgroundColor: isFollowing ? accentColor : accentColor + '18',
              },
            ]}
            accessibilityLabel={isFollowing ? `Unfollow ${person.name}` : `Follow ${person.name}`}
          >
            {isFollowing ? (
              <Ionicons name="checkmark" size={compact ? 14 : 16} color="#FFFFFF" />
            ) : (
              <Text
                style={[styles.initials, { color: accentColor, fontSize: compact ? 11 : 13 }]}
              >
                {initials}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nameColumn}
            onPress={() => {
              const id = person.userId || personSlug(person.name);
              router.push(`/person/${id}` as any);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.name, styles.nameClickable, compact && styles.nameCompact]} numberOfLines={1}>
              {person.name}
            </Text>
            <Text style={[styles.role, compact && styles.roleCompact]} numberOfLines={2}>
              {person.role}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step cards band */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeline}
          contentContainerStyle={[styles.timelineContent, compact && styles.timelineContentCompact]}
          {...(Platform.OS === 'web' ? { className: 'timeline-scroll' } as any : {})}
        >
          {person.timeline.map((step, i) => (
            <React.Fragment key={i}>
              {i === currentIdx + 1 && currentIdx >= 0 && (
                <NowDivider accentColor={accentColor} compact={compact} />
              )}
              <StepCard
                step={step}
                accentColor={accentColor}
                compact={compact}
                isSelected={selectedIdx === i}
                onPress={() => setSelectedIdx(selectedIdx === i ? null : i)}
              />
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      {/* Inline detail row */}
      {selectedStep && (
        <InlineStepDetail
          step={selectedStep}
          accentColor={accentColor}
          onClose={() => setSelectedIdx(null)}
          isLoggedIn={isLoggedIn}
          userId={user?.id}
          realStepId={selectedIdx !== null ? realStepIds?.[selectedIdx] : undefined}
          interestId={interestId}
          interestSlug={interestSlug}
          stepIndex={selectedIdx ?? 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
    ...Platform.select({
      web: { overflow: 'visible' } as any,
    }),
  },
  rowCompact: {
    paddingVertical: 4,
    gap: 8,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 200,
    flexShrink: 0,
  },
  personInfoCompact: {
    width: 140,
    gap: 6,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
  nameColumn: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  nameClickable: {
    ...Platform.select({ web: { cursor: 'pointer' } }),
    textDecorationLine: 'underline',
    textDecorationColor: '#D1D5DB',
  },
  nameCompact: {
    fontSize: 12,
  },
  role: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
    lineHeight: 14,
  },
  roleCompact: {
    fontSize: 9,
    lineHeight: 12,
  },
  timeline: {
    flex: 1,
    ...Platform.select({
      web: {
        overflowX: 'auto',
        overflowY: 'hidden',
      } as any,
    }),
  },
  timelineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
  },
  timelineContentCompact: {
    gap: 4,
  },

  // Step card
  stepCard: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      } as any,
    }),
  },

  // Badge
  badge: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
    minWidth: 34,
    alignItems: 'center',
  },
  badgeCompact: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginBottom: 2,
    minWidth: 28,
  },
  badgeUpcoming: {
    backgroundColor: 'transparent',
  },
  badgeLine: {
    width: 20,
    height: 2,
    backgroundColor: '#D1D5DB',
    borderRadius: 1,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
  badgeTextCompact: {
    fontSize: 7,
  },

  // Step label
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  stepLabelCompact: {
    fontSize: 8,
    lineHeight: 11,
  },

  // NOW divider
  nowDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 72,
    flexShrink: 0,
  },
  nowDividerCompact: {
    width: 22,
    height: 52,
  },
  nowLine: {
    width: 2,
    flex: 1,
    borderRadius: 1,
    opacity: 0.4,
  },
  nowPill: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  nowText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  nowTextCompact: {
    fontSize: 6,
  },
});
