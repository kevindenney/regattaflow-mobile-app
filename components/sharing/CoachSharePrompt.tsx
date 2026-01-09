/**
 * Coach Share Prompt
 * One-tap share banner that appears after completing post-race analysis
 * "Share with Coach Sarah?" style prompt
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import type { CoachProfile, ShareResult } from './types';

const logger = createLogger('CoachSharePrompt');

interface CoachSharePromptProps {
  visible: boolean;
  onDismiss: () => void;
  onShareComplete?: (result: ShareResult) => void;
  sailorId: string;
  raceId: string;
  raceName: string;
  shareType: 'pre_race' | 'post_race';
}

export function CoachSharePrompt({
  visible,
  onDismiss,
  onShareComplete,
  sailorId,
  raceId,
  raceName,
  shareType,
}: CoachSharePromptProps) {
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    if (visible) {
      loadPrimaryCoach();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadPrimaryCoach = async () => {
    if (!sailorId) return;

    setLoading(true);
    try {
      // Find the sailor's most recent active coaching relationship
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select(`
          coach_id,
          coach:coach_profiles(
            id,
            user_id,
            display_name,
            is_verified,
            profile_image_url
          )
        `)
        .eq('sailor_id', sailorId)
        .eq('status', 'completed')
        .order('scheduled_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0 && sessions[0].coach) {
        setCoach(sessions[0].coach as unknown as CoachProfile);
      }
    } catch (error) {
      logger.error('Failed to load primary coach:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!coach) return;

    setSharing(true);
    try {
      // Create notification for the coach
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: coach.user_id,
          type: shareType === 'pre_race' ? 'strategy_shared' : 'analysis_shared',
          title: shareType === 'pre_race' ? 'Strategy Shared' : 'Race Analysis Shared',
          message: `${shareType === 'pre_race' ? 'Race strategy' : 'Race analysis'} for ${raceName} has been shared with you`,
          data: {
            race_id: raceId,
            sailor_id: sailorId,
            share_type: shareType,
          },
          read: false,
        });

      if (error) {
        throw error;
      }

      // Record the share
      await supabase.from('race_shares').insert({
        race_event_id: raceId,
        sailor_id: sailorId,
        share_type: shareType,
        channel: 'coach',
        recipient_id: coach.id,
        recipient_type: 'coach',
      });

      const result: ShareResult = {
        success: true,
        channel: 'coach',
        recipientName: coach.display_name,
      };

      onShareComplete?.(result);
      onDismiss();

      if (Platform.OS === 'web') {
        alert(`Shared with ${coach.display_name}!`);
      } else {
        Alert.alert('Shared!', `Your analysis has been shared with ${coach.display_name}.`);
      }
    } catch (error) {
      logger.error('Failed to share with coach:', error);
      if (Platform.OS === 'web') {
        alert('Failed to share. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to share. Please try again.');
      }
    } finally {
      setSharing(false);
    }
  };

  // Don't render if no coach or still loading
  if (!visible || loading || !coach) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="school" size={24} color="#3B82F6" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Share with {coach.display_name}?</Text>
          <Text style={styles.subtitle}>
            {shareType === 'pre_race' ? 'Get feedback on your strategy' : 'Get coaching on your race'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          disabled={sharing}
        >
          <Text style={styles.dismissText}>Not now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareButton, sharing && styles.shareButtonDisabled]}
          onPress={handleShare}
          disabled={sharing}
        >
          <MaterialCommunityIcons
            name="send"
            size={18}
            color="white"
          />
          <Text style={styles.shareText}>
            {sharing ? 'Sharing...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dismissButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
