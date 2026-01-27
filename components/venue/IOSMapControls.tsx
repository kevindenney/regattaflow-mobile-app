/**
 * IOSMapControls - Apple Maps Style
 *
 * Single floating pill with map controls:
 * - Horizontal layout: Layers | 3D | Location
 * - SF Symbols for all icons
 * - Blur material background
 * - Haptic feedback on interactions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
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

// Types
export interface MapLayers {
  racingAreas: boolean;
  courseMarks: boolean;
  prohibitedZones: boolean;
  currentArrows: boolean;
  yachtClubs: boolean;
  sailmakers: boolean;
  marinas: boolean;
}

interface IOSMapControlsProps {
  /** 3D mode state */
  is3DEnabled?: boolean;
  /** Handler for 3D toggle */
  onToggle3D?: () => void;
  /** Handler for location/compass press */
  onLocationPress?: () => void;
  /** Current layer state */
  layers?: Partial<MapLayers>;
  /** Handler for layer changes */
  onLayersChange?: (layers: MapLayers) => void;
  /** Whether to show compact mode (just icons) */
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Layer configuration
const LAYER_CONFIG: Array<{
  key: keyof MapLayers;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  section: 'racing' | 'places';
}> = [
  // Racing layers
  { key: 'racingAreas', label: 'Racing Areas', icon: 'map-outline', color: IOS_COLORS.systemBlue, section: 'racing' },
  { key: 'courseMarks', label: 'Course Marks', icon: 'flag-outline', color: IOS_COLORS.systemOrange, section: 'racing' },
  { key: 'prohibitedZones', label: 'Prohibited Zones', icon: 'warning-outline', color: IOS_COLORS.systemRed, section: 'racing' },
  { key: 'currentArrows', label: 'Current Flow', icon: 'git-merge-outline', color: IOS_COLORS.systemTeal, section: 'racing' },
  // Places layers
  { key: 'yachtClubs', label: 'Yacht Clubs', icon: 'business-outline', color: IOS_COLORS.systemBlue, section: 'places' },
  { key: 'sailmakers', label: 'Sailmakers', icon: 'triangle-outline', color: IOS_COLORS.systemOrange, section: 'places' },
  { key: 'marinas', label: 'Marinas', icon: 'boat-outline', color: IOS_COLORS.systemTeal, section: 'places' },
];

const DEFAULT_LAYERS: MapLayers = {
  racingAreas: false,
  courseMarks: false,
  prohibitedZones: false,
  currentArrows: false,
  yachtClubs: true,
  sailmakers: false,
  marinas: false,
};

export function IOSMapControls({
  is3DEnabled = false,
  onToggle3D,
  onLocationPress,
  layers: externalLayers,
  onLayersChange,
  compact = false,
}: IOSMapControlsProps) {
  const [showLayerSheet, setShowLayerSheet] = useState(false);
  const [internalLayers, setInternalLayers] = useState<MapLayers>(DEFAULT_LAYERS);

  const layers = { ...DEFAULT_LAYERS, ...externalLayers } as MapLayers;

  // Animation values
  const layersButtonScale = useSharedValue(1);
  const threeDButtonScale = useSharedValue(1);
  const locationButtonScale = useSharedValue(1);

  const handleLayersPress = () => {
    triggerHaptic('impactLight');
    setShowLayerSheet(true);
  };

  const handleToggle3D = () => {
    triggerHaptic('impactMedium');
    onToggle3D?.();
  };

  const handleLocationPress = () => {
    triggerHaptic('impactLight');
    onLocationPress?.();
  };

  const toggleLayer = (key: keyof MapLayers) => {
    triggerHaptic('selection');
    const newLayers = { ...layers, [key]: !layers[key] };
    if (onLayersChange) {
      onLayersChange(newLayers);
    } else {
      setInternalLayers(newLayers);
    }
  };

  // Animated styles
  const layersButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: layersButtonScale.value }],
  }));

  const threeDButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: threeDButtonScale.value }],
  }));

  const locationButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: locationButtonScale.value }],
  }));

  // Check if any layers are active
  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  const ControlPill = Platform.OS === 'ios' ? BlurView : View;
  const pillProps = Platform.OS === 'ios'
    ? { intensity: 80, tint: 'light' as const }
    : {};

  return (
    <>
      <View style={styles.container}>
        {/* Main Control Pill */}
        <ControlPill {...pillProps} style={styles.controlPill}>
          <View style={styles.controlPillInner}>
            {/* Layers Button */}
            <AnimatedPressable
              style={[styles.controlButton, layersButtonStyle]}
              onPress={handleLayersPress}
              onPressIn={() => {
                layersButtonScale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
              }}
              onPressOut={() => {
                layersButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
              }}
              accessibilityRole="button"
              accessibilityLabel="Map layers"
            >
              <Ionicons
                name="layers"
                size={20}
                color={activeLayerCount > 0 ? IOS_COLORS.systemBlue : IOS_COLORS.label}
              />
              {!compact && (
                <Text style={[
                  styles.controlLabel,
                  activeLayerCount > 0 && styles.controlLabelActive
                ]}>
                  Layers
                </Text>
              )}
              {activeLayerCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeLayerCount}</Text>
                </View>
              )}
            </AnimatedPressable>

            {/* Divider */}
            <View style={styles.divider} />

            {/* 3D Button */}
            {onToggle3D && (
              <>
                <AnimatedPressable
                  style={[styles.controlButton, threeDButtonStyle]}
                  onPress={handleToggle3D}
                  onPressIn={() => {
                    threeDButtonScale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
                  }}
                  onPressOut={() => {
                    threeDButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle 3D view"
                  accessibilityState={{ selected: is3DEnabled }}
                >
                  <Ionicons
                    name="cube-outline"
                    size={20}
                    color={is3DEnabled ? IOS_COLORS.systemBlue : IOS_COLORS.label}
                  />
                  {!compact && (
                    <Text style={[
                      styles.controlLabel,
                      is3DEnabled && styles.controlLabelActive
                    ]}>
                      3D
                    </Text>
                  )}
                </AnimatedPressable>

                <View style={styles.divider} />
              </>
            )}

            {/* Location/Compass Button */}
            {onLocationPress && (
              <AnimatedPressable
                style={[styles.controlButton, locationButtonStyle]}
                onPress={handleLocationPress}
                onPressIn={() => {
                  locationButtonScale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
                }}
                onPressOut={() => {
                  locationButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
                }}
                accessibilityRole="button"
                accessibilityLabel="Center on location"
              >
                <Ionicons
                  name="location"
                  size={20}
                  color={IOS_COLORS.systemBlue}
                />
              </AnimatedPressable>
            )}
          </View>
        </ControlPill>
      </View>

      {/* Layer Selection Sheet */}
      <Modal
        visible={showLayerSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLayerSheet(false)}
      >
        <View style={styles.sheetContainer}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Map Layers</Text>
            <Pressable
              style={styles.doneButton}
              onPress={() => setShowLayerSheet(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>

          {/* Layer List */}
          <ScrollView style={styles.sheetContent}>
            {/* Racing Section */}
            <Text style={styles.sectionTitle}>RACING</Text>
            <View style={styles.layerSection}>
              {LAYER_CONFIG.filter(l => l.section === 'racing').map((layer, index) => (
                <Pressable
                  key={layer.key}
                  style={[
                    styles.layerItem,
                    index === 0 && styles.layerItemFirst,
                    index === LAYER_CONFIG.filter(l => l.section === 'racing').length - 1 && styles.layerItemLast,
                  ]}
                  onPress={() => toggleLayer(layer.key)}
                >
                  <View style={styles.layerItemLeft}>
                    <View style={[styles.layerIcon, { backgroundColor: `${layer.color}15` }]}>
                      <Ionicons name={layer.icon} size={18} color={layer.color} />
                    </View>
                    <Text style={styles.layerLabel}>{layer.label}</Text>
                  </View>
                  {layers[layer.key] && (
                    <Ionicons name="checkmark" size={22} color={IOS_COLORS.systemBlue} />
                  )}
                </Pressable>
              ))}
            </View>

            {/* Places Section */}
            <Text style={styles.sectionTitle}>PLACES</Text>
            <View style={styles.layerSection}>
              {LAYER_CONFIG.filter(l => l.section === 'places').map((layer, index) => (
                <Pressable
                  key={layer.key}
                  style={[
                    styles.layerItem,
                    index === 0 && styles.layerItemFirst,
                    index === LAYER_CONFIG.filter(l => l.section === 'places').length - 1 && styles.layerItemLast,
                  ]}
                  onPress={() => toggleLayer(layer.key)}
                >
                  <View style={styles.layerItemLeft}>
                    <View style={[styles.layerIcon, { backgroundColor: `${layer.color}15` }]}>
                      <Ionicons name={layer.icon} size={18} color={layer.color} />
                    </View>
                    <Text style={styles.layerLabel}>{layer.label}</Text>
                  </View>
                  {layers[layer.key] && (
                    <Ionicons name="checkmark" size={22} color={IOS_COLORS.systemBlue} />
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    right: 16,
    zIndex: 150,
  },
  controlPill: {
    borderRadius: IOS_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },
  controlPillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.xs,
    paddingVertical: IOS_SPACING.xs,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: IOS_SPACING.md,
    paddingVertical: IOS_SPACING.sm,
    borderRadius: IOS_RADIUS.sm,
  },
  controlLabel: {
    fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  controlLabelActive: {
    color: IOS_COLORS.systemBlue,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: IOS_COLORS.separator,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: IOS_COLORS.systemBlue,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Sheet styles
  sheetContainer: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemGroupedBackground,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: IOS_SPACING.sm,
    paddingBottom: IOS_SPACING.lg,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: IOS_COLORS.systemGray4,
    marginBottom: IOS_SPACING.md,
  },
  sheetTitle: {
    fontSize: IOS_TYPOGRAPHY.headline.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  doneButton: {
    position: 'absolute',
    right: IOS_SPACING.lg,
    top: IOS_SPACING.xl,
  },
  doneButtonText: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.systemBlue,
  },
  sheetContent: {
    flex: 1,
    paddingTop: IOS_SPACING.lg,
  },
  sectionTitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    marginHorizontal: IOS_SPACING.lg,
    marginBottom: IOS_SPACING.sm,
  },
  layerSection: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    marginHorizontal: IOS_SPACING.lg,
    borderRadius: IOS_RADIUS.md,
    marginBottom: IOS_SPACING.xl,
    overflow: 'hidden',
  },
  layerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  layerItemFirst: {
    borderTopLeftRadius: IOS_RADIUS.md,
    borderTopRightRadius: IOS_RADIUS.md,
  },
  layerItemLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: IOS_RADIUS.md,
    borderBottomRightRadius: IOS_RADIUS.md,
  },
  layerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: IOS_SPACING.md,
  },
  layerIcon: {
    width: 32,
    height: 32,
    borderRadius: IOS_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layerLabel: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.label,
  },
});

export default IOSMapControls;
