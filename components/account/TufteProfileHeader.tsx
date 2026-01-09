/**
 * TufteProfileHeader
 *
 * Dense profile header with avatar initials, name, email, and edit link.
 * No decorative elements - typography does the work.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { tufteAccountStyles as styles, getInitials, formatMemberSince } from './accountStyles';

interface TufteProfileHeaderProps {
  name: string;
  email?: string;
  memberSince?: string | Date | null;
  onEditPress?: () => void;
}

export function TufteProfileHeader({
  name,
  email,
  memberSince,
  onEditPress,
}: TufteProfileHeaderProps) {
  const initials = getInitials(name);
  const memberSinceText = formatMemberSince(memberSince);

  return (
    <View style={styles.profileHeader}>
      <View style={styles.profileHeaderContent}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{name || 'User'}</Text>
          {email ? <Text style={styles.profileEmail}>{email}</Text> : null}
          {memberSinceText ? <Text style={styles.profileMeta}>{memberSinceText}</Text> : null}
        </View>
        {onEditPress && (
          <TouchableOpacity onPress={onEditPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
