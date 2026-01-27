/**
 * Races Floating Header - Redesigned
 *
 * Clean header bar for the races screen:
 * - Large left-aligned "Races" title
 * - Race counter ("13 of 22 | 11 upcoming")
 * - Green circular + button on right
 * - Segmented control for filtering (Upcoming | Past | All)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { IOSSegmentedControl } from '@/components/ui/ios';
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

export type RaceFilterSegment = 'upcoming' | 'past' | 'all';

const FILTER_SEGMENTS: { value: RaceFilterSegment; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
];

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
  /** Current filter segment */
  filterSegment?: RaceFilterSegment;
  /** Callback when filter segment changes */
  onFilterChange?: (segment: RaceFilterSegment) => void;
  /** Current scroll offset for large title collapse */
  scrollOffset?: number;
  /** Callback when search text changes */
  onSearchChange?: (text: string) => void;
  /** Whether search is active */
  searchActive?: boolean;
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
 * Redesigned Header Component
 */
export function RacesFloatingHeader({
  topInset,
  loadingInsights = false,
  weatherLoading = false,
  isOnline,
  onAddRace,
  onAddPractice,
  filterSegment = 'upcoming',
  onFilterChange,
  scrollOffset = 0,
  onSearchChange,
  onAddButtonLayout,
  measureTrigger,
  totalRaces,
  upcomingRaces,
  currentRaceIndex,
  onUpcomingPress,
}: RacesFloatingHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<TextInput>(null);

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
    if (!onAddPractice) {
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

  // Handle search toggle
  const handleSearchToggle = () => {
    triggerHaptic('selection');
    if (searchVisible) {
      setSearchVisible(false);
      setSearchText('');
      onSearchChange?.('');
    } else {
      setSearchVisible(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  // Handle search text change
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    onSearchChange?.(text);
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

  // Build the race counter parts
  const hasIndexCounter = currentRaceIndex && totalRaces;
  const hasUpcoming = upcomingRaces !== undefined && upcomingRaces > 0;
  const showCounter = hasIndexCounter || hasUpcoming;

  return (
    <>
      <View style={[styles.container, { paddingTop: topInset }]}>
        {/* Nav bar: title left | counter center | add right */}
        <View style={styles.navBar}>
          {/* Left: Large Title */}
          <View style={styles.titleSection}>
            <Text style={styles.largeTitle}>Races</Text>
            {isLoading && (
              <ActivityIndicator
                size="small"
                color={IOS_COLORS.secondaryLabel}
                style={styles.loadingIndicator}
              />
            )}
            {!isOnline && <OfflineIndicator />}
          </View>

          {/* Center: Race Counter */}
          {showCounter ? (
            <View style={styles.counterSection}>{hasIndexCounter && (
              <Text style={styles.counterText}>{currentRaceIndex} of {totalRaces}</Text>
            )}{hasIndexCounter && hasUpcoming && (
              <Text style={styles.counterText}> | </Text>
            )}{hasUpcoming && (
              <Pressable
                onPress={onUpcomingPress}
                disabled={!onUpcomingPress}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={[styles.counterText, onUpcomingPress && styles.counterLink]}>
                  {upcomingRaces} upcoming
                </Text>
              </Pressable>
            )}</View>
          ) : null}

          {/* Right: Green Add Button */}
          <View ref={addButtonRef} collapsable={false}>
            <AnimatedPressable
              style={[styles.addButton, addButtonAnimStyle]}
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
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </AnimatedPressable>
          </View>
        </View>

        {/* Search Bar (conditionally visible) */}
        {searchVisible && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons
                name="search"
                size={18}
                color={IOS_COLORS.secondaryLabel}
                style={styles.searchIcon}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search races..."
                placeholderTextColor={IOS_COLORS.tertiaryLabel}
                value={searchText}
                onChangeText={handleSearchTextChange}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>
          </View>
        )}

        {/* Segmented Control */}
        {onFilterChange && (
          <View style={styles.segmentedControlContainer}>
            <IOSSegmentedControl
              segments={FILTER_SEGMENTS}
              selectedValue={filterSegment}
              onChange={onFilterChange}
            />
          </View>
        )}
      </View>

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
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.systemGroupedBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: IOS_COLORS.label,
    letterSpacing: -0.5,
  },
  loadingIndicator: {
    marginLeft: 0,
  },
  counterSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '500',
    color: IOS_COLORS.secondaryLabel,
    letterSpacing: -0.2,
  },
  counterLink: {
    color: IOS_COLORS.systemBlue,
    textDecorationLine: 'underline',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: IOS_SPACING.lg,
    paddingBottom: IOS_SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.tertiarySystemFill || IOS_COLORS.systemGray6,
    borderRadius: IOS_RADIUS.sm,
    paddingHorizontal: IOS_SPACING.sm,
    height: 36,
  },
  searchIcon: {
    marginRight: IOS_SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: IOS_TYPOGRAPHY.body.fontSize,
    color: IOS_COLORS.label,
    paddingVertical: 0,
  },
  segmentedControlContainer: {
    paddingHorizontal: IOS_SPACING.sm,
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
