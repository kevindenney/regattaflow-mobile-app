/**
 * IOSVenuePill - Apple Maps Style
 *
 * Floating venue pill overlay that appears at the bottom of the map:
 * - Compact pill with venue name and save button
 * - Tap to expand to full details sheet
 * - SF Symbols and haptic feedback
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

interface IOSVenuePillProps {
  /** Venue name */
  venueName: string;
  /** Country/region subtitle */
  country?: string;
  /** Current wind conditions summary */
  windSummary?: string;
  /** Whether venue is saved/bookmarked */
  isSaved?: boolean;
  /** Handler for save/bookmark action */
  onSavePress?: () => void;
  /** Handler for pill tap to expand details */
  onPress?: () => void;
  /** Handler for directions action */
  onDirectionsPress?: () => void;
  /** Latitude for directions */
  latitude?: number;
  /** Longitude for directions */
  longitude?: number;
  /** Number of racing areas */
  racingAreaCount?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IOSVenuePill({
  venueName,
  country,
  windSummary,
  isSaved = false,
  onSavePress,
  onPress,
  onDirectionsPress,
  latitude,
  longitude,
  racingAreaCount,
}: IOSVenuePillProps) {
  const pillScale = useSharedValue(1);
  const saveButtonScale = useSharedValue(1);
  const directionsButtonScale = useSharedValue(1);

  const handlePress = () => {
    triggerHaptic('impactLight');
    onPress?.();
  };

  const handleSavePress = () => {
    triggerHaptic(isSaved ? 'selection' : 'notificationSuccess');
    onSavePress?.();
  };

  const handleDirectionsPress = () => {
    triggerHaptic('impactLight');
    if (onDirectionsPress) {
      onDirectionsPress();
    } else if (latitude && longitude) {
      openMaps();
    }
  };

  const openMaps = () => {
    if (!latitude || !longitude) return;
    const label = encodeURIComponent(venueName);
    const latLng = `${latitude},${longitude}`;

    const appleMapsURL = `http://maps.apple.com/?ll=${latLng}&q=${label}`;
    const googleMapsURL = `https://www.google.com/maps/search/?api=1&query=${latLng}`;

    if (Platform.OS === 'ios') {
      Linking.openURL(appleMapsURL).catch(() => Linking.openURL(googleMapsURL));
    } else {
      Linking.openURL(googleMapsURL).catch(() => Linking.openURL(appleMapsURL));
    }
  };

  // Animated styles
  const pillAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
  }));

  const saveButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  const directionsButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: directionsButtonScale.value }],
  }));

  // Build subtitle
  const subtitleParts: string[] = [];
  if (country) subtitleParts.push(country);
  if (racingAreaCount && racingAreaCount > 0) {
    subtitleParts.push(`${racingAreaCount} area${racingAreaCount !== 1 ? 's' : ''}`);
  }

  const PillContainer = Platform.OS === 'ios' ? BlurView : View;
  const containerProps = Platform.OS === 'ios'
    ? { intensity: 80, tint: 'light' as const }
    : {};

  return (
    <PillContainer {...containerProps} style={styles.container}>
      <AnimatedPressable
        style={[styles.pillTouchable, pillAnimatedStyle]}
        onPress={handlePress}
        onPressIn={() => {
          pillScale.value = withSpring(0.98, IOS_ANIMATIONS.spring.stiff);
        }}
        onPressOut={() => {
          pillScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${venueName} venue details`}
      >
        {/* Main Content */}
        <View style={styles.content}>
          {/* Venue Name */}
          <Text style={styles.venueName} numberOfLines={1}>
            {venueName}
          </Text>

          {/* Subtitle Row */}
          {(subtitleParts.length > 0 || windSummary) && (
            <View style={styles.subtitleRow}>
              {subtitleParts.length > 0 && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitleParts.join(' · ')}
                </Text>
              )}
              {windSummary && (
                <>
                  {subtitleParts.length > 0 && (
                    <Text style={styles.subtitleDot}> · </Text>
                  )}
                  <View style={styles.windBadge}>
                    <Ionicons name="leaf" size={12} color={IOS_COLORS.systemBlue} />
                    <Text style={styles.windText}>{windSummary}</Text>
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Directions Button */}
          {(latitude && longitude) && (
            <AnimatedPressable
              style={[styles.actionButton, directionsButtonAnimatedStyle]}
              onPress={handleDirectionsPress}
              onPressIn={() => {
                directionsButtonScale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
              }}
              onPressOut={() => {
                directionsButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
              }}
              accessibilityRole="button"
              accessibilityLabel="Get directions"
            >
              <Ionicons
                name="arrow.triangle.turn.up.right.diamond.fill"
                size={20}
                color={IOS_COLORS.systemBlue}
              />
              <Ionicons
                name="navigate"
                size={20}
                color={IOS_COLORS.systemBlue}
              />
            </AnimatedPressable>
          )}

          {/* Save/Bookmark Button */}
          {onSavePress && (
            <AnimatedPressable
              style={[
                styles.actionButton,
                isSaved && styles.actionButtonActive,
                saveButtonAnimatedStyle,
              ]}
              onPress={handleSavePress}
              onPressIn={() => {
                saveButtonScale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
              }}
              onPressOut={() => {
                saveButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
              }}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Remove from saved' : 'Save venue'}
              accessibilityState={{ selected: isSaved }}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? IOS_COLORS.systemBlue : IOS_COLORS.systemGray}
              />
            </AnimatedPressable>
          )}

          {/* Chevron for expand */}
          <Ionicons
            name="chevron-up"
            size={20}
            color={IOS_COLORS.systemGray3}
            style={styles.chevron}
          />
        </View>
      </AnimatedPressable>
    </PillContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: IOS_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  pillTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    gap: IOS_SPACING.md,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  venueName: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 22,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.secondaryLabel,
  },
  subtitleDot: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    color: IOS_COLORS.tertiaryLabel,
  },
  windBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  windText: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.systemBlue,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: IOS_RADIUS.sm,
    backgroundColor: IOS_COLORS.systemGray6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: `${IOS_COLORS.systemBlue}15`,
  },
  chevron: {
    marginLeft: IOS_SPACING.xs,
  },
});

export default IOSVenuePill;
