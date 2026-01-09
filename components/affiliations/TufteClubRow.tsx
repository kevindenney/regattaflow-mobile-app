/**
 * TufteClubRow
 *
 * Dense club row with status dot, role badge, and context subtitle.
 * Follows Tufte principles: data-dense, minimal chrome, typography-driven.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IOS_COLORS } from '@/components/cards/constants';

type MembershipStatus = 'member' | 'reciprocal' | 'pending' | 'inactive';
type MemberRole = 'admin' | 'owner' | 'member' | 'guest';

interface TufteClubRowProps {
  name: string;
  status: MembershipStatus;
  role?: MemberRole;
  subtitle?: string;
  upcomingEvents?: number;
  onPress?: () => void;
  isLast?: boolean;
}

const statusLabels: Record<MembershipStatus, string> = {
  member: 'member',
  reciprocal: 'reciprocal',
  pending: 'pending',
  inactive: 'inactive',
};

const roleLabels: Record<MemberRole, string> = {
  admin: 'Admin',
  owner: 'Owner',
  member: '',
  guest: 'Guest',
};

export function TufteClubRow({
  name,
  status,
  role = 'member',
  subtitle,
  upcomingEvents,
  onPress,
  isLast = false,
}: TufteClubRowProps) {
  const statusLabel = statusLabels[status];
  const roleLabel = roleLabels[role];

  // Build subtitle from props or events count
  let displaySubtitle = subtitle;
  if (!displaySubtitle && upcomingEvents && upcomingEvents > 0) {
    displaySubtitle = `${upcomingEvents} upcoming event${upcomingEvents > 1 ? 's' : ''}`;
  }

  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.content}>
        {/* Title row with status and role */}
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, styles[`statusDot_${status}`]]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          {roleLabel ? (
            <Text style={styles.roleText}>{roleLabel}</Text>
          ) : null}
        </View>

        {/* Subtitle */}
        {displaySubtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {displaySubtitle}
          </Text>
        )}
      </View>

      {/* Chevron */}
      {onPress && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    minHeight: 52,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDot_member: {
    backgroundColor: IOS_COLORS.green,
  },
  statusDot_reciprocal: {
    backgroundColor: IOS_COLORS.blue,
  },
  statusDot_pending: {
    backgroundColor: IOS_COLORS.orange,
  },
  statusDot_inactive: {
    backgroundColor: IOS_COLORS.gray,
  },
  statusText: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  subtitle: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
  },
  chevron: {
    fontSize: 20,
    color: IOS_COLORS.tertiaryLabel,
    marginLeft: 8,
  },
});
