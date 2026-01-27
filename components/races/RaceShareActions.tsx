/**
 * RaceShareActions Component
 *
 * Actions for interacting with another user's race:
 * - "Add to My Timeline" - Copy the race to your calendar
 * - "Request to Join" - Ask to be added as crew
 *
 * Only shown when viewing a race from another user's timeline.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Copy, UserPlus, Check, Calendar, Play } from 'lucide-react-native';
import { CrewFinderService } from '@/services/CrewFinderService';
import { RaceCollaborationService } from '@/services/RaceCollaborationService';
import { useAuth } from '@/providers/AuthProvider';
import { createLogger } from '@/lib/utils/logger';
import * as Haptics from 'expo-haptics';

const logger = createLogger('RaceShareActions');

interface RaceShareActionsProps {
  /** The race ID to act on */
  raceId: string;
  /** The race name for display */
  raceName: string;
  /** The race owner's ID (to prevent showing on own races) */
  raceOwnerId?: string;
  /** Callback when race is copied to timeline */
  onRaceCopied?: (newRaceId: string) => void;
  /** Callback when "Start Planning" is pressed - copies race and navigates */
  onStartPlanning?: (newRaceId: string) => void;
  /** Callback when join request is sent */
  onJoinRequested?: () => void;
  /** Whether the user has already copied this race */
  alreadyCopied?: boolean;
  /** Whether the user has already requested to join */
  alreadyRequested?: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
}

export function RaceShareActions({
  raceId,
  raceName,
  raceOwnerId,
  onRaceCopied,
  onStartPlanning,
  onJoinRequested,
  alreadyCopied = false,
  alreadyRequested = false,
  compact = false,
}: RaceShareActionsProps) {
  const { user } = useAuth();
  const [copying, setCopying] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [startingPlanning, setStartingPlanning] = useState(false);
  const [copied, setCopied] = useState(alreadyCopied);
  const [requested, setRequested] = useState(alreadyRequested);

  // Don't show if this is the user's own race
  if (user?.id === raceOwnerId) {
    return null;
  }

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  // Handle copy to timeline
  const handleCopyToTimeline = useCallback(async () => {
    if (!user?.id || copied || copying) return;

    triggerHaptic();
    setCopying(true);

    try {
      logger.info('Copying race to timeline:', { raceId, raceName });

      const result = await CrewFinderService.copyRaceToTimeline(user.id, raceId);

      if (result.success) {
        setCopied(true);
        triggerHaptic();
        onRaceCopied?.(result.raceId);

        Alert.alert(
          'Added to Timeline',
          `"${raceName}" has been added to your race timeline.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      logger.error('Failed to copy race:', error);
      Alert.alert(
        'Unable to Add',
        error?.message || 'Could not add this race to your timeline. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCopying(false);
    }
  }, [user?.id, raceId, raceName, copied, copying, triggerHaptic, onRaceCopied]);

  // Handle request to join
  const handleRequestToJoin = useCallback(async () => {
    if (!user?.id || requested || requesting) return;

    triggerHaptic();
    setRequesting(true);

    try {
      logger.info('Requesting to join race:', { raceId, raceName });

      // Use RaceCollaborationService to create a pending join request
      await RaceCollaborationService.requestToJoin(raceId, user.id);

      setRequested(true);
      triggerHaptic();
      onJoinRequested?.();

      Alert.alert(
        'Request Sent',
        `Your request to join "${raceName}" has been sent to the organizer.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      logger.error('Failed to request join:', error);
      Alert.alert(
        'Request Failed',
        error?.message || 'Could not send your request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRequesting(false);
    }
  }, [user?.id, raceId, raceName, requested, requesting, triggerHaptic, onJoinRequested]);

  // Handle start planning - copies race and navigates to races tab
  const handleStartPlanning = useCallback(async () => {
    if (!user?.id || startingPlanning) return;

    triggerHaptic();
    setStartingPlanning(true);

    try {
      logger.info('Start planning race:', { raceId, raceName });

      const result = await CrewFinderService.copyRaceToTimeline(user.id, raceId);

      if (result.success) {
        setCopied(true);
        triggerHaptic();

        // Call the onStartPlanning callback to close modal and navigate
        onStartPlanning?.(result.raceId);
      }
    } catch (error: any) {
      logger.error('Failed to start planning:', error);
      Alert.alert(
        'Unable to Start Planning',
        error?.message || 'Could not copy this race to your timeline. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setStartingPlanning(false);
    }
  }, [user?.id, raceId, raceName, startingPlanning, triggerHaptic, onStartPlanning]);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {/* Start Planning Button - Primary action */}
        {Boolean(onStartPlanning) && !copied && (
          <TouchableOpacity
            style={[styles.compactButtonPrimary]}
            onPress={handleStartPlanning}
            disabled={startingPlanning || copied}
          >
            {startingPlanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Play size={14} color="#FFFFFF" />
                <Text style={styles.compactButtonPrimaryText}>Start Planning</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Copy Button - Show if no onStartPlanning or already copied */}
        {(!Boolean(onStartPlanning) || copied) && (
          <TouchableOpacity
            style={[styles.compactButton, copied && styles.compactButtonSuccess]}
            onPress={handleCopyToTimeline}
            disabled={copying || copied}
          >
            {copying ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : copied ? (
              <Check size={16} color="#10B981" />
            ) : (
              <Calendar size={16} color="#3B82F6" />
            )}
          </TouchableOpacity>
        )}

        {/* Join Button */}
        <TouchableOpacity
          style={[styles.compactButton, requested && styles.compactButtonSuccess]}
          onPress={handleRequestToJoin}
          disabled={requesting || requested}
        >
          {requesting ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : requested ? (
            <Check size={16} color="#10B981" />
          ) : (
            <UserPlus size={16} color="#3B82F6" />
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add to My Timeline */}
      <TouchableOpacity
        style={[styles.button, copied && styles.buttonSuccess]}
        onPress={handleCopyToTimeline}
        disabled={copying || copied}
      >
        {copying ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : copied ? (
          <>
            <Check size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Added</Text>
          </>
        ) : (
          <>
            <Calendar size={18} color="#FFFFFF" />
            <Text style={styles.buttonText}>Add to My Timeline</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Request to Join */}
      <TouchableOpacity
        style={[styles.button, styles.buttonSecondary, requested && styles.buttonSecondarySuccess]}
        onPress={handleRequestToJoin}
        disabled={requesting || requested}
      >
        {requesting ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : requested ? (
          <>
            <Check size={18} color="#10B981" />
            <Text style={[styles.buttonText, styles.buttonTextSecondary, styles.buttonTextSuccess]}>
              Request Sent
            </Text>
          </>
        ) : (
          <>
            <UserPlus size={18} color="#3B82F6" />
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Request to Join</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  buttonSecondary: {
    backgroundColor: '#F1F5F9',
  },
  buttonSuccess: {
    backgroundColor: '#10B981',
  },
  buttonSecondarySuccess: {
    backgroundColor: '#ECFDF5',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: '#3B82F6',
  },
  buttonTextSuccess: {
    color: '#10B981',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  compactButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButtonSuccess: {
    backgroundColor: '#ECFDF5',
  },
  compactButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
  },
  compactButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default RaceShareActions;
