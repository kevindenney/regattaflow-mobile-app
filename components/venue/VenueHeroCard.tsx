import { ThemedText } from '@/components/themed-text';
import { TufteTokens, colors } from '@/constants/designSystem';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

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
  // New props for Tufte data density
  racingAreaCount?: number;
  currentConditions?: {
    wind?: string;
    tide?: string;
    temp?: string;
  };
}

export function VenueHeroCard({
  venueName,
  country,
  region,
  distanceLabel,
  windSummary,
  onNavigate,
  onSave,
  isSaved = false,
  latitude,
  longitude,
  racingAreaCount,
  currentConditions,
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

  // Build subtitle parts (Tufte: inline small multiples)
  const subtitleParts: string[] = [];
  if (country) subtitleParts.push(country);
  if (windSummary) subtitleParts.push(windSummary);
  else if (currentConditions?.wind) subtitleParts.push(currentConditions.wind);

  return (
    <View style={styles.container}>
      {/* Header: Full venue name - NEVER truncate */}
      <View style={styles.header}>
        <ThemedText style={styles.venueName} numberOfLines={2}>
          {venueName}
        </ThemedText>
        {!!onSave && (
          <Pressable
            style={[styles.saveButton, isSaved && styles.saveButtonActive]}
            onPress={onSave}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? '#2563eb' : '#6B7280'}
            />
          </Pressable>
        )}
      </View>

      {/* Subtitle: Country + conditions inline */}
      {subtitleParts.length > 0 && (
        <ThemedText style={styles.subtitle}>
          {subtitleParts.join(' · ')}
        </ThemedText>
      )}

      {/* Conditions row (Tufte: data density) */}
      {currentConditions && (
        <View style={styles.conditionsRow}>
          {currentConditions.wind && (
            <View style={styles.conditionItem}>
              <ThemedText style={styles.conditionValue}>{currentConditions.wind}</ThemedText>
              <ThemedText style={styles.conditionLabel}>wind</ThemedText>
            </View>
          )}
          {currentConditions.tide && (
            <View style={styles.conditionItem}>
              <ThemedText style={styles.conditionValue}>{currentConditions.tide}</ThemedText>
              <ThemedText style={styles.conditionLabel}>tide</ThemedText>
            </View>
          )}
          {currentConditions.temp && (
            <View style={styles.conditionItem}>
              <ThemedText style={styles.conditionValue}>{currentConditions.temp}</ThemedText>
              <ThemedText style={styles.conditionLabel}>temp</ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Racing areas count */}
      {racingAreaCount !== undefined && racingAreaCount > 0 && (
        <ThemedText style={styles.metaText}>
          {racingAreaCount} racing area{racingAreaCount !== 1 ? 's' : ''} nearby
        </ThemedText>
      )}

      {/* Minimal divider */}
      <View style={styles.divider} />

      {/* Actions: smaller, data-first (Tufte) */}
      <View style={styles.actionRow}>
        <Pressable
          style={styles.actionButton}
          onPress={onNavigate ?? openMaps}
          disabled={!latitude || !longitude}
        >
          <Ionicons name="navigate-outline" size={16} color="#2563eb" />
          <ThemedText style={styles.actionButtonText}>Navigate</ThemedText>
        </Pressable>

        {distanceLabel && (
          <ThemedText style={styles.distanceText}>{distanceLabel}</ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tufte: minimal container, subtle shadow
  container: {
    backgroundColor: TufteTokens.backgrounds.paper,
    borderRadius: TufteTokens.borderRadius.card,
    paddingVertical: TufteTokens.spacing.section,
    paddingHorizontal: TufteTokens.spacing.section,
    width: '100%',
    maxWidth: 420,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      },
    }),
    gap: TufteTokens.spacing.compact,
  },

  // Header row: venue name + save button
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: TufteTokens.spacing.standard,
  },

  // Venue name: full display, never truncate primary data
  venueName: {
    ...TufteTokens.typography.primary,
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    lineHeight: 26,
  },

  // Save button: minimal, unobtrusive
  saveButton: {
    padding: TufteTokens.spacing.tight,
    borderRadius: TufteTokens.borderRadius.subtle,
  },
  saveButtonActive: {
    backgroundColor: colors.primary[50],
  },

  // Subtitle: country + conditions inline (Tufte: small multiples)
  subtitle: {
    ...TufteTokens.typography.secondary,
    color: colors.text.secondary,
    marginTop: -2,
  },

  // Conditions row: data density
  conditionsRow: {
    flexDirection: 'row',
    gap: TufteTokens.spacing.section,
    marginTop: TufteTokens.spacing.compact,
  },
  conditionItem: {
    alignItems: 'flex-start',
  },
  conditionValue: {
    ...TufteTokens.typography.secondary,
    color: colors.text.primary,
    fontWeight: '600',
  },
  conditionLabel: {
    ...TufteTokens.typography.micro,
    color: colors.text.tertiary,
    textTransform: 'lowercase',
  },

  // Meta text: racing areas count
  metaText: {
    ...TufteTokens.typography.tertiary,
    color: colors.text.secondary,
  },

  // Divider: Tufte hairline
  divider: {
    height: TufteTokens.borders.hairline,
    backgroundColor: TufteTokens.borders.colorSubtle,
    marginVertical: TufteTokens.spacing.compact,
  },

  // Action row: smaller buttons, data first
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Action button: minimal, text-link style
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TufteTokens.spacing.tight,
    paddingVertical: TufteTokens.spacing.tight,
    paddingHorizontal: TufteTokens.spacing.compact,
  },
  actionButtonText: {
    ...TufteTokens.typography.secondary,
    color: colors.primary[600],
    fontWeight: '500',
  },

  // Distance: secondary info
  distanceText: {
    ...TufteTokens.typography.tertiary,
    color: colors.text.tertiary,
  },
});
