import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import type { MapLayers } from '@/components/venue/MapControls';

type ResourceKey = keyof MapLayers;

interface TravelResourceChipsProps {
  layers: MapLayers;
  onToggleLayer: (layer: ResourceKey) => void;
}

const RESOURCE_META: Record<ResourceKey, { label: string; icon: string; color: string }> = {
  yachtClubs: { label: 'Yacht Clubs', icon: 'boat', color: '#2563eb' },
  sailmakers: { label: 'Sailmakers', icon: 'triangle-outline', color: '#f97316' },
  riggers: { label: 'Riggers', icon: 'git-network-outline', color: '#8b5cf6' },
  coaches: { label: 'Coaches', icon: 'person-outline', color: '#10b981' },
  chandlery: { label: 'Chandlery', icon: 'cart-outline', color: '#f43f5e' },
  clothing: { label: 'Foul Weather', icon: 'shirt-outline', color: '#fb923c' },
  marinas: { label: 'Marinas', icon: 'boat-outline', color: '#0ea5e9' },
  repair: { label: 'Repair', icon: 'construct-outline', color: '#ec4899' },
  engines: { label: 'Engine', icon: 'cog-outline', color: '#64748b' },
};

export function TravelResourceChips({ layers, onToggleLayer }: TravelResourceChipsProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.heading}>Travel Resources</ThemedText>
      <ThemedText style={styles.subheading}>
        Toggle the layers you need while planning your trip
      </ThemedText>

      <View style={styles.chipGrid}>
        {(Object.keys(RESOURCE_META) as ResourceKey[]).map((key) => {
          const meta = RESOURCE_META[key];
          const active = layers[key];
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                { borderColor: active ? meta.color : '#e5e7eb', backgroundColor: active ? `${meta.color}15` : '#fff' },
              ]}
              onPress={() => onToggleLayer(key)}
            >
              <Ionicons
                name={meta.icon as any}
                size={16}
                color={active ? meta.color : '#4b5563'}
              />
              <ThemedText style={[styles.chipLabel, { color: active ? meta.color : '#374151' }]}>
                {meta.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    gap: 6,
    width: '100%',
    maxWidth: 420,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  subheading: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
