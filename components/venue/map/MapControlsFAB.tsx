/**
 * MapControlsFAB - Apple Maps Style Floating Action Buttons
 *
 * Two stacked blur-backed circular buttons (top-right):
 * - Layers: opens layer selection modal (same UI as IOSMapControls)
 * - Location: centers map on user location
 *
 * 44x44pt touch targets per HIG. BlurView on iOS, white fallback elsewhere.
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
import type { MapLayers } from '../IOSMapControls';

// Layer configuration (mirrors IOSMapControls)
const LAYER_CONFIG: {
  key: keyof MapLayers;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  section: 'racing' | 'places';
}[] = [
  { key: 'racingAreas', label: 'Racing Areas', icon: 'map-outline', color: IOS_COLORS.systemBlue, section: 'racing' },
  { key: 'courseMarks', label: 'Course Marks', icon: 'flag-outline', color: IOS_COLORS.systemOrange, section: 'racing' },
  { key: 'prohibitedZones', label: 'Prohibited Zones', icon: 'warning-outline', color: IOS_COLORS.systemRed, section: 'racing' },
  { key: 'currentArrows', label: 'Current Flow', icon: 'git-merge-outline', color: IOS_COLORS.systemTeal, section: 'racing' },
  { key: 'yachtClubs', label: 'Yacht Clubs', icon: 'business-outline', color: IOS_COLORS.systemBlue, section: 'places' },
  { key: 'sailmakers', label: 'Sailmakers', icon: 'triangle-outline', color: IOS_COLORS.systemOrange, section: 'places' },
  { key: 'marinas', label: 'Marinas', icon: 'boat-outline', color: IOS_COLORS.systemTeal, section: 'places' },
];

interface MapControlsFABProps {
  layers: MapLayers;
  onLayersChange: (layers: MapLayers) => void;
  onLocationPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FABButton({
  icon,
  label,
  isActive,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  isActive?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const tint = isActive ? IOS_COLORS.systemBlue : IOS_COLORS.label;

  const ButtonContainer = Platform.OS === 'ios' ? BlurView : View;
  const containerProps = Platform.OS === 'ios'
    ? { intensity: 80, tint: 'light' as const }
    : {};

  return (
    <AnimatedPressable
      style={animStyle}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
      }}
    >
      <ButtonContainer {...containerProps} style={styles.fabButton}>
        <Ionicons name={icon} size={20} color={tint} />
      </ButtonContainer>
    </AnimatedPressable>
  );
}

export function MapControlsFAB({
  layers,
  onLayersChange,
  onLocationPress,
}: MapControlsFABProps) {
  const [showLayerSheet, setShowLayerSheet] = useState(false);

  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  const toggleLayer = (key: keyof MapLayers) => {
    triggerHaptic('selection');
    onLayersChange({ ...layers, [key]: !layers[key] });
  };

  return (
    <>
      <View style={styles.container} pointerEvents="box-none">
        <FABButton
          icon="layers"
          label="Map layers"
          isActive={activeLayerCount > 0}
          onPress={() => setShowLayerSheet(true)}
        />
        <FABButton
          icon="location"
          label="Center on location"
          onPress={onLocationPress}
        />
      </View>

      {/* Layer Selection Sheet */}
      <Modal
        visible={showLayerSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLayerSheet(false)}
      >
        <View style={styles.sheetContainer}>
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

          <ScrollView style={styles.sheetContent}>
            {(['racing', 'places'] as const).map((section) => {
              const sectionLayers = LAYER_CONFIG.filter((l) => l.section === section);
              return (
                <React.Fragment key={section}>
                  <Text style={styles.sectionTitle}>
                    {section.toUpperCase()}
                  </Text>
                  <View style={styles.layerSection}>
                    {sectionLayers.map((layer, index) => (
                      <Pressable
                        key={layer.key}
                        style={[
                          styles.layerItem,
                          index === 0 && styles.layerItemFirst,
                          index === sectionLayers.length - 1 && styles.layerItemLast,
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
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 150,
    gap: 8,
    alignItems: 'center',
  },
  fabButton: {
    width: 44,
    height: 44,
    borderRadius: IOS_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
      },
    }),
  },

  // Sheet styles (mirrors IOSMapControls)
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

export default MapControlsFAB;
