/**
 * RaceCoachingCard
 *
 * Contextual coaching cards for race prep and review phases.
 * Adapts based on whether the sailor has a coach or not.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRaceCoachingContext, CoachingContext, CoachInfo } from '@/hooks/useRaceCoachingContext';
import { useAuth } from '@/providers/AuthProvider';
import { coachingService } from '@/services/CoachingService';
import { messagingService } from '@/services/MessagingService';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';

interface RaceCoachingCardProps {
  raceId: string;
  context: CoachingContext;
  /** Boat class for filtering coach discovery */
  boatClass?: string;
  /** Debrief data to share with coach (for review context) */
  debriefData?: any;
  /** Race plan data to share with coach (for prep context) */
  racePlanData?: any;
}

export function RaceCoachingCard({
  raceId,
  context,
  boatClass,
  debriefData,
  racePlanData,
}: RaceCoachingCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    isLoading,
    hasCoach,
    hasMultipleCoaches,
    getRelevantCoach,
    getOtherCoaches,
    shouldShowCard,
    dismissCard,
  } = useRaceCoachingContext();

  // Don't render if shouldn't show
  if (isLoading || !shouldShowCard(raceId, context)) {
    return null;
  }

  const handleDismiss = () => {
    dismissCard(raceId, context);
  };

  // No coach - show discovery prompt
  if (!hasCoach) {
    return (
      <NoCoachCard
        context={context}
        boatClass={boatClass}
        onDismiss={handleDismiss}
      />
    );
  }

  // Has coach - show action card
  const primaryCoach = getRelevantCoach(context);
  const otherCoaches = getOtherCoaches(context);

  if (!primaryCoach) return null;

  return (
    <HasCoachCard
      context={context}
      primaryCoach={primaryCoach}
      otherCoaches={otherCoaches}
      debriefData={debriefData}
      racePlanData={racePlanData}
      raceId={raceId}
      sailorUserId={user?.id}
      onDismiss={handleDismiss}
    />
  );
}

// ============================================================================
// No Coach Card
// ============================================================================

interface NoCoachCardProps {
  context: CoachingContext;
  boatClass?: string;
  onDismiss: () => void;
}

function NoCoachCard({ context, boatClass, onDismiss }: NoCoachCardProps) {
  const router = useRouter();

  const handleFindCoach = () => {
    const params: any = {};
    if (boatClass) {
      params.boatClass = boatClass;
    }
    if (context === 'prep') {
      params.specialty = 'race_strategy';
    }
    router.push({
      pathname: '/coach/discover',
      params,
    });
  };

  const title = context === 'prep'
    ? 'Not sure about your strategy?'
    : 'Want expert eyes on this race?';

  const subtitle = context === 'prep'
    ? 'Book a pre-race consult with a coach'
    : 'Find a coach to review your debrief';

  return (
    <View className="mt-4 bg-indigo-50 rounded-xl border border-indigo-100 p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 flex-row items-start gap-3">
          <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
            <Ionicons
              name={context === 'prep' ? 'compass-outline' : 'eye-outline'}
              size={20}
              color="#4F46E5"
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-800">
              {title}
            </Text>
            <Text className="text-sm text-slate-600 mt-0.5">
              {subtitle}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="p-1"
        >
          <Ionicons name="close" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleFindCoach}
        className="mt-3 bg-indigo-600 rounded-lg py-2.5 px-4 flex-row items-center justify-center gap-2"
      >
        <Ionicons name="search-outline" size={18} color="#FFFFFF" />
        <Text className="text-white font-semibold text-sm">
          Find a Coach
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// Has Coach Card
// ============================================================================

interface HasCoachCardProps {
  context: CoachingContext;
  primaryCoach: CoachInfo;
  otherCoaches: CoachInfo[];
  debriefData?: any;
  racePlanData?: any;
  raceId: string;
  sailorUserId?: string;
  onDismiss: () => void;
}

function HasCoachCard({
  context,
  primaryCoach,
  otherCoaches,
  debriefData,
  racePlanData,
  raceId,
  sailorUserId,
  onDismiss,
}: HasCoachCardProps) {
  const router = useRouter();
  const [sending, setSending] = React.useState(false);

  const handlePrimaryAction = async () => {
    if (context === 'review' && debriefData) {
      // Share debrief with coach
      setSending(true);
      try {
        showConfirm(
          'Share Debrief',
          `Send your race debrief to ${primaryCoach.displayName}?`,
          async () => {
            try {
              await coachingService.shareDebriefWithCoach({
                coachId: primaryCoach.id,
                raceId,
                sailorId: sailorUserId || '',
                raceName: debriefData?.raceName || 'Race',
                message: debriefData?.summary,
              });
              showAlert('Sent', `Your debrief has been shared with ${primaryCoach.displayName}.`);
            } catch (err) {
              showAlert('Error', 'Failed to share debrief. Please try again.');
            }
          }
        );
      } finally {
        setSending(false);
      }
    } else if (context === 'prep') {
      // Open conversation with coach, pre-filled with race plan context
      try {
        if (!sailorUserId || !primaryCoach.userId) return;
        const conversationId = await messagingService.getOrCreateConversation(
          primaryCoach.userId,
          sailorUserId
        );
        const raceName = racePlanData?.raceName || 'an upcoming race';
        const raceDate = racePlanData?.raceDate || '';
        router.push({
          pathname: `/coach/conversation/${conversationId}` as any,
          params: {
            prefill: `I have a race coming up: ${raceName}${raceDate ? ` on ${raceDate}` : ''}. Here's my race plan...`,
          },
        });
      } catch {
        // Fallback to booking if conversation creation fails
        router.push({
          pathname: '/coach/book',
          params: {
            coachId: primaryCoach.id,
            coachName: primaryCoach.displayName,
            sessionType: 'strategy',
            context: 'pre-race',
          },
        });
      }
    }
  };

  const handleChooseOther = () => {
    // Show coach selection or go to coaches list
    if (otherCoaches.length === 1) {
      // Just one other coach, go directly
      if (context === 'prep') {
        router.push({
          pathname: '/coach/book',
          params: {
            coachId: otherCoaches[0].id,
            coachName: otherCoaches[0].displayName,
            sessionType: 'strategy',
          },
        });
      }
    } else {
      // Multiple other coaches - in future, could show a picker
      router.push('/coach/my-bookings');
    }
  };

  const title = context === 'prep'
    ? `Ask ${primaryCoach.displayName} about your race plan`
    : `Share this debrief with ${primaryCoach.displayName}`;

  const actionLabel = context === 'prep'
    ? 'Book Pre-Race Session'
    : 'Share Debrief';

  const actionIcon = context === 'prep' ? 'calendar-outline' : 'paper-plane-outline';

  return (
    <View className="mt-4 bg-emerald-50 rounded-xl border border-emerald-100 p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 flex-row items-start gap-3">
          {/* Coach avatar */}
          {primaryCoach.profilePhotoUrl ? (
            <Image
              source={{ uri: primaryCoach.profilePhotoUrl }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-emerald-200 items-center justify-center">
              <Text className="text-emerald-700 font-bold text-base">
                {primaryCoach.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-800">
              {title}
            </Text>
            <Text className="text-sm text-slate-600 mt-0.5">
              One tap to {context === 'prep' ? 'book a session' : 'share your analysis'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="p-1"
        >
          <Ionicons name="close" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handlePrimaryAction}
        disabled={sending}
        className="mt-3 bg-emerald-600 rounded-lg py-2.5 px-4 flex-row items-center justify-center gap-2"
      >
        <Ionicons name={actionIcon as any} size={18} color="#FFFFFF" />
        <Text className="text-white font-semibold text-sm">
          {sending ? 'Sending...' : actionLabel}
        </Text>
      </TouchableOpacity>

      {/* Other coaches option */}
      {otherCoaches.length > 0 && (
        <TouchableOpacity
          onPress={handleChooseOther}
          className="mt-2 py-2 flex-row items-center justify-center gap-1"
        >
          <Text className="text-sm text-emerald-700">
            or ask {otherCoaches.length === 1 ? otherCoaches[0].displayName : 'another coach'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="#047857" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default RaceCoachingCard;
