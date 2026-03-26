/**
 * BlueprintPickerCard — subscribe toggle card for blueprint selection during onboarding.
 *
 * Shared between the invite acceptance flow and post-signup org onboarding.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useBlueprintSubscription,
  useSubscribe,
} from '@/hooks/useBlueprint';
import type { BlueprintRecord } from '@/types/blueprint';

interface BlueprintPickerCardProps {
  blueprint: BlueprintRecord;
  accentColor: string;
}

export function BlueprintPickerCard({ blueprint, accentColor }: BlueprintPickerCardProps) {
  const { data: subscription, isLoading: subLoading } = useBlueprintSubscription(blueprint.id);
  const subscribeMutation = useSubscribe();
  const isSubscribed = !!subscription;

  const handleToggle = () => {
    if (isSubscribed || subscribeMutation.isPending) return;
    subscribeMutation.mutate(blueprint.id);
  };

  return (
    <TouchableOpacity
      style={[styles.blueprintCard, isSubscribed && { borderColor: accentColor + '60' }]}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <View style={styles.blueprintCardContent}>
        <View style={[styles.blueprintIcon, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name="document-text-outline" size={22} color={accentColor} />
        </View>
        <View style={styles.blueprintInfo}>
          <Text style={styles.blueprintTitle}>{blueprint.title}</Text>
          {blueprint.description && (
            <Text style={styles.blueprintDescription} numberOfLines={2}>
              {blueprint.description}
            </Text>
          )}
          {blueprint.subscriber_count > 0 && (
            <Text style={styles.blueprintMeta}>
              {blueprint.subscriber_count} subscriber{blueprint.subscriber_count !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <View style={[
          styles.subscribeToggle,
          isSubscribed
            ? { backgroundColor: accentColor, borderColor: accentColor }
            : { borderColor: accentColor },
        ]}>
          {subLoading || subscribeMutation.isPending ? (
            <ActivityIndicator size="small" color={isSubscribed ? '#FFFFFF' : accentColor} />
          ) : (
            <Ionicons
              name={isSubscribed ? 'checkmark' : 'add'}
              size={18}
              color={isSubscribed ? '#FFFFFF' : accentColor}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  blueprintCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  blueprintCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blueprintIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueprintInfo: {
    flex: 1,
  },
  blueprintTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  blueprintDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  blueprintMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  subscribeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
