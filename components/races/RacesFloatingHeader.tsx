/**
 * Races Floating Header - Redesigned with TabScreenToolbar
 *
 * Consistent tab screen header using the shared TabScreenToolbar:
 * - Large left-aligned "Races" title
 * - Race counter subtitle ("13 of 22 | 11 upcoming")
 * - White capsule with add (+) icon
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { NotificationBell } from '@/components/social/NotificationBell';
import { TourStep } from '@/components/onboarding/TourStep';
import {
  TabScreenToolbar,
  capsuleStyles,
} from '@/components/ui/TabScreenToolbar';
import {
  IOS_COLORS,
  IOS_TYPOGRAPHY,
  IOS_SPACING,
  IOS_RADIUS,
  IOS_SHADOWS,
  IOS_ANIMATIONS,
} from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import type { LayoutRectangle } from 'react-native';

export type RaceFilterSegment = 'upcoming' | 'past' | 'progress';

export interface RacesFloatingHeaderProps {
  /** Top inset for safe area */
  topInset: number;
  /** Whether insights are loading */
  loadingInsights?: boolean;
  /** Whether weather is loading */
  weatherLoading?: boolean;
  /** Whether device is online */
  isOnline: boolean;
  /** Callback when add race is pressed */
  onAddRace: () => void;
  /** Callback when add practice is pressed */
  onAddPractice?: () => void;
  /** Callback when new season is pressed */
  onNewSeason?: () => void;
  /** Callback when browse catalog is pressed */
  onBrowseCatalog?: () => void;
  /** Current scroll offset for large title collapse */
  scrollOffset?: number;
  /** Callback to expose the + button's layout for onboarding tour spotlight */
  onAddButtonLayout?: (layout: LayoutRectangle) => void;
  /** Trigger value to force re-measurement of add button (e.g., when tour becomes visible) */
  measureTrigger?: boolean | number;
  /** Total number of races in the season */
  totalRaces?: number;
  /** Number of upcoming races */
  upcomingRaces?: number;
  /** Current race index (1-based, for "X of Y" display) */
  currentRaceIndex?: number;
  /** Callback when "X upcoming" is pressed to navigate to next race */
  onUpcomingPress?: () => void;
  /** Callback reporting the measured height of the toolbar (for content paddingTop) */
  onMeasuredHeight?: (height: number) => void;
  /** When true the toolbar slides up off-screen */
  hidden?: boolean;
  /** Legacy drawer props - kept for compatibility but not rendered */
  drawerVisible?: boolean;
  onDrawerVisibleChange?: (visible: boolean) => void;
  onLearnItemLayout?: (layout: LayoutRectangle) => void;
  onVenueItemLayout?: (layout: LayoutRectangle) => void;
  onCoachingItemLayout?: (layout: LayoutRectangle) => void;
  onPricingItemLayout?: (layout: LayoutRectangle) => void;
  skipDrawer?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Races Header built on TabScreenToolbar
 */
export function RacesFloatingHeader({
  topInset,
  loadingInsights = false,
  weatherLoading = false,
  isOnline,
  onAddRace,
  onAddPractice,
  onNewSeason,
  onBrowseCatalog,
  scrollOffset: _scrollOffset = 0,
  onAddButtonLayout,
  measureTrigger,
  totalRaces,
  upcomingRaces,
  currentRaceIndex,
  onUpcomingPress,
  onMeasuredHeight,
  hidden,
}: RacesFloatingHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  // Animation values
  const menuFadeAnim = useSharedValue(0);
  const menuScaleAnim = useSharedValue(0.9);
  const addButtonScale = useSharedValue(1);

  // Ref for the + button to expose layout for onboarding tour
  const addButtonRef = useRef<View>(null);

  // Measure and report the + button's layout for onboarding tour spotlight
  useEffect(() => {
    if (!onAddButtonLayout) return;

    const timer = setTimeout(() => {
      if (Platform.OS === 'web') {
        const buttonNode = addButtonRef.current as unknown as { getBoundingClientRect?: () => DOMRect };
        if (buttonNode?.getBoundingClientRect) {
          const rect = buttonNode.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            onAddButtonLayout({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
          }
        }
      } else {
        addButtonRef.current?.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            onAddButtonLayout({ x, y, width, height });
          }
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [onAddButtonLayout, measureTrigger]);

  // Show menu with animation
  const showMenu = () => {
    setMenuVisible(true);
    menuFadeAnim.value = withTiming(1, { duration: 200 });
    menuScaleAnim.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
  };

  // Hide menu with animation
  const hideMenu = () => {
    menuFadeAnim.value = withTiming(0, { duration: 150 });
    menuScaleAnim.value = withTiming(0.9, { duration: 150 });
    setTimeout(() => setMenuVisible(false), 150);
  };

  // Handle add button press
  const handleAddPress = () => {
    triggerHaptic('impactLight');
    if (!onAddPractice && !onNewSeason) {
      onAddRace();
      return;
    }
    showMenu();
  };

  const handleMenuOption = (action: () => void) => {
    hideMenu();
    setTimeout(() => {
      action();
    }, 100);
  };

  // Animated styles
  const menuOverlayStyle = useAnimatedStyle(() => ({
    opacity: menuFadeAnim.value,
  }));

  const menuContainerStyle = useAnimatedStyle(() => ({
    opacity: menuFadeAnim.value,
    transform: [{ scale: menuScaleAnim.value }],
  }));

  const addButtonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addButtonScale.value }],
  }));

  const isLoading = loadingInsights || weatherLoading;

  // Build the race counter subtitle (hidden for progress segment)
  const hasIndexCounter = Boolean(currentRaceIndex && totalRaces && totalRaces > 0 && currentRaceIndex <= totalRaces);
  const hasUpcoming = upcomingRaces !== undefined && upcomingRaces > 0;
  const subtitleParts: string[] = [];
  if (hasIndexCounter) {
    subtitleParts.push(`${currentRaceIndex} of ${totalRaces}`);
  }
  if (hasUpcoming) {
    subtitleParts.push(`${upcomingRaces} upcoming`);
  }
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' | ') : undefined;

  // Custom right capsule with notification bell and add button (preserving add button ref)
  const rightCapsule = (
    <View style={capsuleStyles.capsule}>
      {/* Notification bell */}
      <View style={capsuleStyles.actionButton}>
        <NotificationBell size={20} color={IOS_COLORS.secondaryLabel} />
      </View>

      <View style={capsuleStyles.capsuleDivider} />

      {/* Add button (with ref for onboarding spotlight) */}
      <TourStep step="add_your_race" position="bottom">
        <View ref={addButtonRef} collapsable={false}>
          <AnimatedPressable
            style={[capsuleStyles.actionButton, addButtonAnimStyle]}
            onPress={handleAddPress}
            onPressIn={() => {
              addButtonScale.value = withSpring(0.9, IOS_ANIMATIONS.spring.stiff);
            }}
            onPressOut={() => {
              addButtonScale.value = withSpring(1, IOS_ANIMATIONS.spring.snappy);
            }}
            accessibilityLabel="Add race"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={20} color={IOS_COLORS.secondaryLabel} />
          </AnimatedPressable>
        </View>
      </TourStep>
    </View>
  );

  return (
    <>
      <TabScreenToolbar
        title="Race"
        subtitle={subtitle}
        onSubtitlePress={hasUpcoming ? onUpcomingPress : undefined}
        topInset={topInset}
        isLoading={isLoading}
        rightContent={rightCapsule}
        onMeasuredHeight={onMeasuredHeight}
        hidden={hidden}
      >
        {/* Offline indicator */}
        {!isOnline && (
          <View style={styles.offlineContainer}>
            <OfflineIndicator />
          </View>
        )}
      </TabScreenToolbar>

      {/* Add Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={hideMenu}
        statusBarTranslucent
      >
        <Animated.View style={[styles.menuOverlay, menuOverlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={hideMenu} />
          <Animated.View style={[styles.menuContainer, menuContainerStyle]}>
            {/* Header */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Create New</Text>
              <TouchableOpacity
                onPress={hideMenu}
                style={styles.menuCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color={IOS_COLORS.systemGray3} />
              </TouchableOpacity>
            </View>

            {/* Menu Options */}
            <View style={styles.menuOptions}>
              {/* Add Race Option */}
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => handleMenuOption(onAddRace)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuOptionIcon, { backgroundColor: `${IOS_COLORS.systemBlue}15` }]}>
                  <MaterialCommunityIcons name="flag-checkered" size={24} color={IOS_COLORS.systemBlue} />
                </View>
                <View style={styles.menuOptionContent}>
                  <Text style={styles.menuOptionTitle}>Add Race</Text>
                  <Text style={styles.menuOptionSubtitle}>
                    Regatta, series race, or single event
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.systemGray3} />
              </TouchableOpacity>

              {/* Separator */}
              <View style={styles.menuSeparator} />

              {/* Add Practice Option */}
              {onAddPractice && (
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => handleMenuOption(onAddPractice)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuOptionIcon, { backgroundColor: `${IOS_COLORS.systemGreen}15` }]}>
                    <MaterialCommunityIcons name="sail-boat" size={24} color={IOS_COLORS.systemGreen} />
                  </View>
                  <View style={styles.menuOptionContent}>
                    <Text style={styles.menuOptionTitle}>Add Practice</Text>
                    <Text style={styles.menuOptionSubtitle}>
                      Drills, boat handling, or training
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.systemGray3} />
                </TouchableOpacity>
              )}

              {/* New Season Option */}
              {onNewSeason && (
                <>
                  <View style={styles.menuSeparator} />
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => handleMenuOption(onNewSeason)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuOptionIcon, { backgroundColor: `${IOS_COLORS.systemOrange}15` }]}>
                      <MaterialCommunityIcons name="calendar-plus" size={24} color={IOS_COLORS.systemOrange} />
                    </View>
                    <View style={styles.menuOptionContent}>
                      <Text style={styles.menuOptionTitle}>New Season</Text>
                      <Text style={styles.menuOptionSubtitle}>
                        Start a new racing season
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.systemGray3} />
                  </TouchableOpacity>
                </>
              )}

              {/* Browse Catalog Option */}
              {onBrowseCatalog && (
                <>
                  <View style={styles.menuSeparator} />
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={() => handleMenuOption(onBrowseCatalog)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.menuOptionIcon, { backgroundColor: `${IOS_COLORS.systemPurple}15` }]}>
                      <MaterialCommunityIcons name="trophy-outline" size={24} color={IOS_COLORS.systemPurple} />
                    </View>
                    <View style={styles.menuOptionContent}>
                      <Text style={styles.menuOptionTitle}>Browse Race Catalog</Text>
                      <Text style={styles.menuOptionSubtitle}>
                        Find and follow major regattas
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={IOS_COLORS.systemGray3} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  offlineContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.xs,
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: IOS_SPACING.xl,
  },
  menuContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    borderRadius: IOS_RADIUS.lg,
    width: '100%',
    maxWidth: 340,
    ...IOS_SHADOWS.card,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: IOS_SPACING.lg,
    paddingTop: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
  },
  menuTitle: {
    fontSize: IOS_TYPOGRAPHY.title3.fontSize,
    fontWeight: IOS_TYPOGRAPHY.title3.fontWeight as any,
    color: IOS_COLORS.label,
  },
  menuCloseButton: {
    padding: IOS_SPACING.xs,
    marginRight: -IOS_SPACING.xs,
  },
  menuOptions: {
    paddingBottom: IOS_SPACING.md,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IOS_SPACING.md,
    paddingHorizontal: IOS_SPACING.lg,
  },
  menuOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: IOS_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionContent: {
    flex: 1,
    marginLeft: IOS_SPACING.md,
    marginRight: IOS_SPACING.sm,
  },
  menuOptionTitle: {
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    fontWeight: '600',
    color: IOS_COLORS.label,
    marginBottom: 2,
  },
  menuOptionSubtitle: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: IOS_SPACING.lg,
    marginLeft: 76, // Align with text after icon
  },
});

export default RacesFloatingHeader;
