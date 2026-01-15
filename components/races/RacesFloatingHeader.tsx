/**
 * Races Floating Header
 *
 * Top header bar for the races screen with hamburger menu,
 * section title, loading indicator, add race button, and user avatar.
 * Integrates with NavigationDrawer for Tufte-style navigation.
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Modal, Pressable, Animated, useWindowDimensions, LayoutRectangle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { floatingHeaderStyles } from '@/components/races/styles';
import { NavigationDrawer } from '@/components/navigation/NavigationDrawer';
import { TUFTE_BACKGROUND } from '@/components/cards/constants';

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
  /** Callback to expose the + button's layout for onboarding tour spotlight */
  onAddButtonLayout?: (layout: LayoutRectangle) => void;
  /** Trigger value to force re-measurement of add button (e.g., when tour becomes visible) */
  measureTrigger?: boolean | number;
  /** Controlled drawer visibility (for onboarding tour) */
  drawerVisible?: boolean;
  /** Callback when drawer visibility changes */
  onDrawerVisibleChange?: (visible: boolean) => void;
  /** Layout callbacks for navigation drawer menu items (onboarding tour) */
  onLearnItemLayout?: (layout: LayoutRectangle) => void;
  onVenueItemLayout?: (layout: LayoutRectangle) => void;
  onCoachingItemLayout?: (layout: LayoutRectangle) => void;
  onPricingItemLayout?: (layout: LayoutRectangle) => void;
  /** Skip rendering drawer internally (for rendering it separately during tour) */
  skipDrawer?: boolean;
}

/**
 * Floating Header Component
 */
export function RacesFloatingHeader({
  topInset,
  loadingInsights = false,
  weatherLoading = false,
  isOnline,
  onAddRace,
  onAddPractice,
  onAddButtonLayout,
  measureTrigger,
  drawerVisible: controlledDrawerVisible,
  onDrawerVisibleChange,
  onLearnItemLayout,
  onVenueItemLayout,
  onCoachingItemLayout,
  onPricingItemLayout,
  skipDrawer = false,
}: RacesFloatingHeaderProps) {
  // Support both controlled and uncontrolled drawer state
  const [internalDrawerVisible, setInternalDrawerVisible] = useState(false);
  const isDrawerVisible = controlledDrawerVisible ?? internalDrawerVisible;
  const setDrawerVisible = onDrawerVisibleChange ?? setInternalDrawerVisible;

  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const { width: windowWidth } = useWindowDimensions();

  // Ref for the + button to expose layout for onboarding tour
  const addButtonRef = useRef<View>(null);

  // Measure and report the + button's layout for onboarding tour spotlight
  // Re-measures when measureTrigger changes (e.g., when tour becomes visible)
  useEffect(() => {
    if (!onAddButtonLayout) return;

    // Small delay to ensure the button has rendered and any layout changes have settled
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
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hide menu with animation
  const hideMenu = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setMenuVisible(false));
  };

  // Handle add button press - show custom menu
  const handleAddPress = () => {
    // If no practice handler provided, just add race directly
    if (!onAddPractice) {
      onAddRace();
      return;
    }
    showMenu();
  };

  const handleMenuOption = (action: () => void) => {
    console.log('[RacesFloatingHeader] handleMenuOption called, action type:', typeof action);
    hideMenu();
    // Small delay to let animation finish
    setTimeout(() => {
      console.log('[RacesFloatingHeader] Executing action after timeout');
      try {
        action();
        console.log('[RacesFloatingHeader] Action executed successfully');
      } catch (error) {
        console.error('[RacesFloatingHeader] Action error:', error);
      }
    }, 100);
  };

  return (
    <>
      <View style={[floatingHeaderStyles.container, styles.headerBg, { paddingTop: topInset }]}>
        {/* Left: Hamburger menu */}
        <View style={floatingHeaderStyles.left}>
          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={() => setDrawerVisible(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
          >
            <Ionicons name="menu" size={24} color="#374151" />
          </TouchableOpacity>
          {(loadingInsights || weatherLoading) && (
            <ActivityIndicator size="small" color="#9CA3AF" style={{ marginLeft: 8 }} />
          )}
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Right: Actions */}
        <View style={floatingHeaderStyles.right}>
          {!isOnline && <OfflineIndicator />}
          {/* Add button - wrapped with ref for onboarding tour spotlight */}
          <View ref={addButtonRef} collapsable={false}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddPress}
              accessibilityLabel="Add race or practice"
              accessibilityRole="button"
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Navigation Drawer - skip when rendered separately during tour */}
      {!skipDrawer && (
        <NavigationDrawer
          visible={isDrawerVisible}
          onClose={() => setDrawerVisible(false)}
          onLearnItemLayout={onLearnItemLayout}
          onVenueItemLayout={onVenueItemLayout}
          onCoachingItemLayout={onCoachingItemLayout}
          onPricingItemLayout={onPricingItemLayout}
        />
      )}

      {/* Add Menu Modal - Custom design for all platforms */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={hideMenu}
        statusBarTranslucent
      >
        <Pressable style={styles.menuOverlay} onPress={hideMenu}>
          <Animated.View
            style={[
              styles.menuContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                maxWidth: Math.min(windowWidth - 48, 320),
              },
            ]}
            // Prevent touches on menu from closing the overlay
            onStartShouldSetResponder={() => true}
          >
            {/* Header */}
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Create New</Text>
              <TouchableOpacity
                onPress={hideMenu}
                style={styles.menuCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.menuDivider} />

            {/* Menu Options */}
            <View style={styles.menuOptions}>
              {/* Add Race Option */}
              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => {
                  console.log('[RacesFloatingHeader] Add Race TouchableOpacity pressed');
                  handleMenuOption(onAddRace);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.menuOptionIcon, { backgroundColor: '#EBF4FF' }]}>
                  <MaterialCommunityIcons name="flag-checkered" size={22} color="#2563EB" />
                </View>
                <View style={styles.menuOptionContent}>
                  <Text style={styles.menuOptionTitle}>Add Race</Text>
                  <Text style={styles.menuOptionSubtitle}>
                    Add a regatta, series race, or single event
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>

              {/* Add Practice Option */}
              {onAddPractice && (
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => handleMenuOption(onAddPractice)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                    <MaterialCommunityIcons name="sail-boat" size={22} color="#16A34A" />
                  </View>
                  <View style={styles.menuOptionContent}>
                    <Text style={styles.menuOptionTitle}>Add Practice Session</Text>
                    <Text style={styles.menuOptionSubtitle}>
                      Plan drills, boat handling, or training
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: TUFTE_BACKGROUND,
  },
  hamburgerButton: {
    padding: 8,
    marginLeft: -8,
  },
  addButton: {
    padding: 8,
    marginRight: -8,
  },
  addButtonText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#007AFF',
  },
  // Custom menu styles for all platforms
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    // Elevation for Android
    elevation: 16,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    letterSpacing: -0.3,
  },
  menuCloseButton: {
    padding: 4,
    marginRight: -4,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  menuOptions: {
    paddingVertical: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOptionContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuOptionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default RacesFloatingHeader;
