/**
 * Share Channel Grid
 * Grid of sharing channel buttons (WhatsApp, Email, Copy, etc.)
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ShareChannel } from './types';

interface ChannelConfig {
  key: ShareChannel;
  label: string;
  icon: string;
  color: string;
}

const CHANNELS: ChannelConfig[] = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
  { key: 'email', label: 'Email', icon: 'email', color: '#EA4335' },
  { key: 'copy', label: 'Copy', icon: 'content-copy', color: '#64748B' },
  { key: 'native', label: 'More...', icon: 'share-variant', color: '#3B82F6' },
];

interface ShareChannelGridProps {
  onSelectChannel: (channel: ShareChannel) => void;
  loading?: boolean;
  loadingChannel?: ShareChannel | null;
  disabled?: boolean;
  channels?: ShareChannel[];
}

export function ShareChannelGrid({
  onSelectChannel,
  loading = false,
  loadingChannel = null,
  disabled = false,
  channels = ['whatsapp', 'email', 'copy', 'native'],
}: ShareChannelGridProps) {
  const visibleChannels = CHANNELS.filter(c => channels.includes(c.key));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quick Share</Text>
      <View style={styles.grid}>
        {visibleChannels.map(channel => {
          const isLoading = loadingChannel === channel.key;
          const isDisabled = disabled || loading;

          return (
            <TouchableOpacity
              key={channel.key}
              style={[styles.channelButton, isDisabled && styles.channelButtonDisabled]}
              onPress={() => onSelectChannel(channel.key)}
              disabled={isDisabled}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${channel.color}15` }]}>
                {isLoading ? (
                  <ActivityIndicator size="small" color={channel.color} />
                ) : (
                  <MaterialCommunityIcons
                    name={channel.icon as any}
                    size={24}
                    color={channel.color}
                  />
                )}
              </View>
              <Text style={[styles.channelLabel, isDisabled && styles.channelLabelDisabled]}>
                {channel.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  channelButton: {
    alignItems: 'center',
    minWidth: 70,
  },
  channelButtonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  channelLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0F172A',
  },
  channelLabelDisabled: {
    color: '#94A3B8',
  },
});
