/**
 * CommunicationsCard Component
 *
 * Displays VHF channels and contact information
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/race-ui/Card';
import { CardHeader } from '@/components/race-ui/CardHeader';
import { Chip } from '@/components/race-ui/Chip';
import { Typography, Spacing, colors, BorderRadius, Shadows } from '@/constants/designSystem';

interface Contact {
  id: string;
  name: string;
  role: string;
  phone?: string;
}

interface CommunicationsCardProps {
  vhfChannel?: string;
  workingChannel?: string;
  contacts?: Contact[];
}

const ContactChip: React.FC<{
  contact: Contact;
  onPress: () => void;
}> = ({ contact, onPress }) => (
  <Pressable
    style={({ pressed }) => [
      styles.contactChip,
      pressed && styles.contactChipPressed,
    ]}
    onPress={onPress}
  >
    <View style={styles.contactIcon}>
      <Ionicons name="person" size={12} color={colors.primary[600]} />
    </View>
    <View style={styles.contactInfo}>
      <Text style={styles.contactName}>{contact.name}</Text>
      <Text style={styles.contactRole}>{contact.role}</Text>
    </View>
    {contact.phone && (
      <Ionicons name="call-outline" size={14} color={colors.text.tertiary} />
    )}
  </Pressable>
);

export const CommunicationsCard: React.FC<CommunicationsCardProps> = ({
  vhfChannel,
  workingChannel,
  contacts = [],
}) => {
  const handleContactPress = (contact: Contact) => {
    if (contact.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  return (
    <Card>
      <CardHeader
        icon="radio-outline"
        title="Communications & Contact"
        iconColor={colors.info[600]}
      />

      {/* VHF Channels */}
      {(vhfChannel || workingChannel) && (
        <View style={styles.channelsSection}>
          <Text style={styles.sectionLabel}>VHF CHANNELS</Text>
          <View style={styles.channelChips}>
            {vhfChannel && (
              <Chip
                text={`Ch ${vhfChannel}`}
                icon="radio"
                color={colors.primary[600]}
                variant="filled"
              />
            )}
            {workingChannel && (
              <Chip
                text={`Ch ${workingChannel} (Working)`}
                icon="radio-outline"
                color={colors.text.secondary}
              />
            )}
          </View>
        </View>
      )}

      {/* Contacts */}
      {contacts.length > 0 && (
        <View style={styles.contactsSection}>
          <Text style={styles.sectionLabel}>RACE OFFICIALS</Text>
          <View style={styles.contactsList}>
            {contacts.map((contact) => (
              <ContactChip
                key={contact.id}
                contact={contact}
                onPress={() => handleContactPress(contact)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Empty state if no data */}
      {!vhfChannel && !workingChannel && contacts.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="radio-outline" size={24} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>No communication details available</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  channelsSection: {
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.captionBold,
    color: colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  channelChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  contactsSection: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  contactsList: {
    gap: Spacing.xs,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.small,
    gap: Spacing.xs,
  },
  contactChipPressed: {
    opacity: 0.7,
  },
  contactIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...Typography.bodyBold,
    fontSize: 12,
    color: colors.text.primary,
    marginBottom: 1,
  },
  contactRole: {
    ...Typography.caption,
    fontSize: 9,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: Spacing.xs,
  },
});
