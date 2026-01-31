/**
 * SailorTimelineModal Component
 *
 * Modal to view another sailor's timeline/races.
 * Reuses TimelineScreen component for consistency.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { X, UserPlus, UserCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { TimelineScreen } from '@/components/races/TimelineScreen';
import { TimelineUser } from '@/hooks/useFollowedTimelines';
import { useIsFollowing } from '@/hooks/useFollowedTimelines';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { TUFTE_BACKGROUND } from '@/components/cards';
import { IOS_COLORS } from '@/lib/design-tokens-ios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SailorTimelineModalProps {
  visible: boolean;
  sailorId: string | null;
  onClose: () => void;
}

interface SailorProfile {
  id: string;
  full_name: string;
  avatar_emoji?: string;
  avatar_color?: string;
}

export function SailorTimelineModal({
  visible,
  sailorId,
  onClose,
}: SailorTimelineModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<SailorProfile | null>(null);
  const [races, setRaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isFollowing, toggleFollow, isLoading: followLoading } = useIsFollowing(sailorId);

  // Handle "Start Planning" - close modal and navigate to races tab with the new race selected
  const handleStartPlanning = useCallback((newRaceId: string) => {
    // Close the modal first
    onClose();

    // Navigate to the races tab with the new race selected
    // Small delay to let the modal close animation complete
    setTimeout(() => {
      router.push({
        pathname: '/(tabs)/races',
        params: { selected: newRaceId },
      });
    }, 300);
  }, [onClose, router]);

  // Handle race selection - navigate to full-screen journey view
  const handleSelectRace = useCallback((raceId: string) => {
    if (!sailorId) return;

    // Close the modal first
    onClose();

    // Navigate to the sailor journey screen
    // Small delay to let the modal close animation complete
    setTimeout(() => {
      router.push({
        pathname: '/sailor-journey/[sailorId]/[raceId]',
        params: { sailorId, raceId },
      });
    }, 300);
  }, [sailorId, onClose, router]);

  // Fetch sailor profile and races
  useEffect(() => {
    if (!visible || !sailorId) {
      setProfile(null);
      setRaces([]);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', sailorId)
          .single();

        if (profileError) throw profileError;

        // Fetch sailor_profile for avatar data and sharing setting
        const { data: sailorProfileData } = await supabase
          .from('sailor_profiles')
          .select('avatar_emoji, avatar_color, allow_follower_sharing')
          .eq('user_id', sailorId)
          .single();

        setProfile({
          ...profileData,
          avatar_emoji: sailorProfileData?.avatar_emoji,
          avatar_color: sailorProfileData?.avatar_color,
        });

        // Check if sailor allows sharing (for viewing other people's timelines)
        const isOwnTimeline = user?.id === sailorId;
        const allowsSharing = sailorProfileData?.allow_follower_sharing !== false;

        // Only fetch races if viewing own timeline or sailor allows sharing
        let racesData: any[] = [];
        if (isOwnTimeline || allowsSharing) {
          const { data, error: racesError } = await supabase
            .from('regattas')
            .select('*')
            .eq('created_by', sailorId)
            .order('start_date', { ascending: false })
            .limit(20);

          if (racesError) throw racesError;
          racesData = data || [];
        }

        setRaces(racesData);
      } catch (err) {
        console.error('[SailorTimelineModal] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [visible, sailorId]);

  // Build timeline user
  const timelineUser: TimelineUser | null = profile
    ? {
        id: profile.id,
        name: profile.full_name,
        avatar: {
          emoji: profile.avatar_emoji || '⛵',
          color: profile.avatar_color || '#64748B',
        },
        isCurrentUser: false,
      }
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={24} color="#64748B" />
          </TouchableOpacity>

          {profile && (
            <>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {profile.full_name}'s Timeline
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={toggleFollow}
                disabled={followLoading}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={16} color="#10B981" />
                    <Text style={styles.followingText}>Following</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} color={IOS_COLORS.systemBlue} />
                    <Text style={styles.followText}>Follow</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={IOS_COLORS.systemBlue} />
              <Text style={styles.loadingText}>Loading timeline...</Text>
            </View>
          ) : timelineUser ? (
            <TimelineScreen
              user={timelineUser}
              races={races}
              isActive={true}
              currentUserId={user?.id}
              onSelectRace={handleSelectRace}
              onStartPlanning={handleStartPlanning}
            />
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Unable to load sailor profile</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  followingButton: {
    backgroundColor: '#ECFDF5',
  },
  followText: {
    fontSize: 14,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  followingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default SailorTimelineModal;
