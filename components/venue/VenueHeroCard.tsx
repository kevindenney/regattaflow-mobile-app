import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface VenueHeroCardProps {
  venueName: string;
  country?: string;
  region?: string;
  distanceLabel?: string;
  travelTip?: string;
  windSummary?: string;
  onNavigate?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  latitude?: number;
  longitude?: number;
}

export function VenueHeroCard({
  venueName,
  country,
  region,
  distanceLabel,
  travelTip,
  windSummary,
  onNavigate,
  onSave,
  isSaved = false,
  latitude,
  longitude,
}: VenueHeroCardProps) {
  const openMaps = () => {
    if (!latitude || !longitude) return;
    const label = encodeURIComponent(venueName);
    const latLng = `${latitude},${longitude}`;

    const appleMapsURL = `http://maps.apple.com/?ll=${latLng}&q=${label}`;
    const googleMapsURL = `https://www.google.com/maps/search/?api=1&query=${latLng}&query_place_id=${label}`;

    if (Platform.OS === 'ios') {
      Linking.openURL(appleMapsURL).catch(() => Linking.openURL(googleMapsURL));
    } else {
      Linking.openURL(googleMapsURL).catch(() => Linking.openURL(appleMapsURL));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <ThemedText style={styles.venueName}>{venueName}</ThemedText>
        {!!country && (
          <View style={styles.countryPill}>
            <Ionicons name="flag-outline" size={14} color="#1f2937" />
            <ThemedText style={styles.countryText}>
              {region ? `${country} • ${region}` : country}
            </ThemedText>
          </View>
        )}
      </View>

      {!!distanceLabel && (
        <View style={styles.infoRow}>
          <Ionicons name="pin-outline" size={16} color="#2563eb" />
          <ThemedText style={styles.infoText}>{distanceLabel}</ThemedText>
        </View>
      )}

      {!!windSummary && (
        <View style={styles.infoRow}>
          <Ionicons name="compass-outline" size={16} color="#2563eb" />
          <ThemedText style={styles.infoText}>{windSummary}</ThemedText>
        </View>
      )}

      {!!travelTip && (
        <View style={styles.tipBubble}>
          <ThemedText style={styles.tipText}>{travelTip}</ThemedText>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onNavigate ?? openMaps}
          disabled={!latitude || !longitude}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <ThemedText style={styles.primaryButtonText}>Navigate</ThemedText>
        </TouchableOpacity>

        {!!onSave && (
          <TouchableOpacity
            style={[styles.secondaryButton, isSaved && styles.secondaryButtonActive]}
            onPress={onSave}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? '#2563eb' : '#1f2937'}
            />
            <ThemedText
              style={[
                styles.secondaryButtonText,
                isSaved && styles.secondaryButtonTextActive,
              ]}
            >
              {isSaved ? 'Saved' : 'Save Venue'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 420,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.12)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      },
    }),
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  venueName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  countryText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#1f2937',
  },
  tipBubble: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#1d4ed8',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
  },
  secondaryButtonActive: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  secondaryButtonTextActive: {
    color: '#2563eb',
  },
});
