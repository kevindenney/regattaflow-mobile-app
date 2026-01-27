/**
 * PublicFleetCard Component
 *
 * Card for browsing public fleets in the discovery screen.
 * Shows fleet name, boat class, member count, and join button.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Users, MapPin, UserPlus, UserCheck, MessageCircle } from 'lucide-react-native';
import { BrowseFleet } from '@/hooks/usePublicFleets';
import { IOS_COLORS } from '@/lib/design-tokens-ios';

interface PublicFleetCardProps {
  fleet: BrowseFleet;
  onPress: () => void;
  onJoin: () => void;
  isJoining?: boolean;
}

export function PublicFleetCard({
  fleet,
  onPress,
  onJoin,
  isJoining = false,
}: PublicFleetCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left: Fleet Info */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {fleet.name}
          </Text>
          {fleet.hasWhatsApp && (
            <View style={styles.whatsAppBadge}>
              <MessageCircle size={10} color="#25D366" />
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          {fleet.boatClassName && (
            <Text style={styles.boatClass} numberOfLines={1}>
              {fleet.boatClassName}
            </Text>
          )}
          {fleet.region && (
            <View style={styles.location}>
              <MapPin size={10} color="#94A3B8" />
              <Text style={styles.locationText} numberOfLines={1}>
                {fleet.region}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <Users size={12} color="#64748B" />
          <Text style={styles.statText}>
            {fleet.memberCount} {fleet.memberCount === 1 ? 'member' : 'members'}
          </Text>
        </View>
      </View>

      {/* Right: Join Button */}
      <TouchableOpacity
        style={[
          styles.joinButton,
          fleet.isMember && styles.memberButton,
        ]}
        onPress={(e) => {
          e.stopPropagation();
          if (!fleet.isMember && !isJoining) {
            onJoin();
          }
        }}
        activeOpacity={fleet.isMember ? 1 : 0.7}
        disabled={fleet.isMember || isJoining}
      >
        {isJoining ? (
          <ActivityIndicator size="small" color={IOS_COLORS.systemBlue} />
        ) : fleet.isMember ? (
          <>
            <UserCheck size={14} color="#10B981" />
            <Text style={styles.memberText}>Member</Text>
          </>
        ) : (
          <>
            <UserPlus size={14} color={IOS_COLORS.systemBlue} />
            <Text style={styles.joinText}>Join</Text>
          </>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  whatsAppBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E8FDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  boatClass: {
    fontSize: 13,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    marginLeft: 12,
  },
  memberButton: {
    backgroundColor: '#ECFDF5',
  },
  joinText: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  memberText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#10B981',
  },
});

export default PublicFleetCard;
