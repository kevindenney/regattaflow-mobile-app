import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { SampleGroup } from '@/lib/landing/sampleData';
import { PersonTimelineRow } from './PersonTimelineRow';
import { useAuth } from '@/providers/AuthProvider';
import { showAlert } from '@/lib/utils/crossPlatformAlert';
import { fleetService } from '@/services/fleetService';

interface GroupSectionProps {
  group: SampleGroup;
  accentColor: string;
  level?: number;
  interestSlug?: string;
}

export function GroupSection({ group, accentColor, level = 0, interestSlug }: GroupSectionProps) {
  const { user, isGuest } = useAuth();
  const isLoggedIn = !!user && !isGuest;
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = useCallback(async () => {
    if (!isLoggedIn) {
      router.push(
        interestSlug
          ? { pathname: '/(auth)/signup', params: { interest: interestSlug } } as any
          : '/(auth)/signup'
      );
      return;
    }

    const newState = !isFollowing;
    setIsFollowing(newState);

    // Wire up real fleet follow when group has a fleetId
    if (group.fleetId && user) {
      try {
        if (newState) {
          await fleetService.followFleet(user.id, group.fleetId);
          showAlert('Following', `You're now following "${group.name}". Updates will appear in your feed.`);
        } else {
          await fleetService.unfollowFleet(user.id, group.fleetId);
        }
      } catch {
        setIsFollowing(!newState);
        showAlert('Error', 'Could not update follow status. Please try again.');
      }
    } else if (newState) {
      showAlert('Following', `You're now following "${group.name}". Updates will appear in your feed.`);
    }
  }, [isFollowing, isLoggedIn, group.fleetId, group.name, user]);

  return (
    <View style={[styles.container, level > 0 && styles.nested]}>
      <View style={styles.groupHeader}>
        <Text style={[styles.groupName, level > 0 && styles.subgroupName]}>{group.name}</Text>
        {level === 0 && (
          <TouchableOpacity
            style={[
              styles.trackBtn,
              isFollowing && { backgroundColor: accentColor + '12', borderColor: accentColor + '40' },
            ]}
            onPress={handleFollow}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFollowing ? 'checkmark-circle' : 'add-circle-outline'}
              size={14}
              color={isFollowing ? accentColor : '#6B7280'}
            />
            <Text style={[styles.trackBtnText, isFollowing && { color: accentColor }]}>
              {isFollowing
                ? 'Following'
                : isLoggedIn
                  ? 'Follow'
                  : 'Sign Up to Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {group.people.map((person, i) => (
        <PersonTimelineRow key={i} person={person} accentColor={accentColor} interestSlug={interestSlug} />
      ))}

      {group.subgroups?.map((sub, i) => (
        <GroupSection key={i} group={sub} accentColor={accentColor} level={level + 1} interestSlug={interestSlug} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  nested: {
    marginLeft: 16,
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  subgroupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});
